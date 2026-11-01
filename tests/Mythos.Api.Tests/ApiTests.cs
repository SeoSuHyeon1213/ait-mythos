using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Mythos.Api.Persistence;
using Mythos.Api.Domain;
using Mythos.Api.Services;
using NUnit.Framework;
namespace Mythos.Api.Tests;
public class ApiTests {
 private WebApplicationFactory<Program> factory=null!;
 private HttpClient client=null!;
 private readonly string dbPath=Path.Combine(Path.GetTempPath(),$"mythos-tests-{Guid.NewGuid()}.db");
 [OneTimeSetUp] public async Task Start() {
  factory=new WebApplicationFactory<Program>().WithWebHostBuilder(b=>{b.UseEnvironment("Testing"); b.ConfigureAppConfiguration((_,c)=>c.AddInMemoryCollection(new Dictionary<string,string?> { ["ConnectionStrings:Mythos"]=$"Data Source={dbPath};Pooling=False" }));});
  client=factory.CreateClient();
  using var scope=factory.Services.CreateScope();var db=scope.ServiceProvider.GetRequiredService<MythosDbContext>();
  var odin=await db.Entries.SingleAsync();
  var thor=new MythEntry {Slug="thor-test",Name="테스트 토르",OriginalName="Thor",CultureId="norse",CategoryId="god",Summary="테스트용",Description="테스트용",MaterialType="테스트 데이터"};
  thor.Tags=await db.Tags.ToListAsync();
  db.Entries.Add(thor);await db.SaveChangesAsync();
  db.Relations.Add(new(){FromEntryId=odin.Id,ToEntryId=thor.Id,Kind="테스트 관계"});await db.SaveChangesAsync();
 }
 [OneTimeTearDown] public void Stop(){client.Dispose();factory.Dispose();if(File.Exists(dbPath)) File.Delete(dbPath);}
 private async Task<JsonElement> Get(string path) {var response=await client.GetAsync(path);response.EnsureSuccessStatusCode();using var doc=JsonDocument.Parse(await response.Content.ReadAsStringAsync());return doc.RootElement.Clone();}
 [TestCase("오딘")][TestCase("Odin")][TestCase("Óðinn")][TestCase("알파더")][TestCase("WODEN")]
 public async Task SearchAliases(string q) {var data=await Get("/api/v1/entries?q="+Uri.EscapeDataString(q));Assert.That(data.GetProperty("total").GetInt32(),Is.EqualTo(1));Assert.That(data.GetProperty("items")[0].GetProperty("slug").GetString(),Is.EqualTo("odin"));}
 [Test] public async Task SearchDoesNotDuplicateNameAndAliases(){var d=await Get("/api/v1/entries?q=O");Assert.That(d.GetProperty("items").EnumerateArray().Count(x=>x.GetProperty("slug").GetString()=="odin"),Is.EqualTo(1));}
 [Test] public async Task CombinedFiltersAndPagination(){var d=await Get("/api/v1/entries?q=odin&culture=norse&category=god&tag=wisdom&pageSize=1");Assert.That(d.GetProperty("total").GetInt32(),Is.EqualTo(1));Assert.That(d.GetProperty("items").GetArrayLength(),Is.EqualTo(1));var empty=await Get("/api/v1/entries?tag=missing");Assert.That(empty.GetProperty("total").GetInt32(),Is.Zero);var page=await Get("/api/v1/entries?pageSize=1&page=2");Assert.That(page.GetProperty("items")[0].GetProperty("slug").GetString(),Is.EqualTo("thor-test"));}
 [Test] public async Task SharedTagFindsBothEntries(){var d=await Get("/api/v1/entries?tag=wisdom");Assert.That(d.GetProperty("total").GetInt32(),Is.EqualTo(2));}
 [Test] public async Task DetailContainsSources(){var d=await Get("/api/v1/entries/odin");Assert.That(d.GetProperty("sources")[0].GetProperty("url").GetString(),Does.StartWith("https://"));}
 [Test] public async Task RelationIsDirectedAndResolves(){var d=await Get("/api/v1/entries/odin/related");Assert.That(d[0].GetProperty("slug").GetString(),Is.EqualTo("thor-test"));var reverse=await Get("/api/v1/entries/thor-test/related");Assert.That(reverse.GetArrayLength(),Is.Zero);}
 [TestCase("/api/v1/entries/no-such-entry",404)][TestCase("/api/v1/entries/no-such-entry/related",404)][TestCase("/api/v1/entries?page=0",400)][TestCase("/api/v1/entries?pageSize=101",400)][TestCase("/api/v1/entries?page=abc",400)]
 public async Task InvalidRequests(string path,int status){Assert.That((int)(await client.GetAsync(path)).StatusCode,Is.EqualTo(status));}
 [Test] public async Task ImportIsRepeatable(){using var scope=factory.Services.CreateScope();var db=scope.ServiceProvider.GetRequiredService<MythosDbContext>();var count=await db.Entries.CountAsync();var env=scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();await SeedImporter.Import(db,Path.Combine(env.ContentRootPath,"Content","entries.json"));Assert.That(await db.Entries.CountAsync(),Is.EqualTo(count));}
 [Test] public void SeedRejectsBrokenReference(){var entry=new SeedEntry("odin","오딘","Odin","요약","설명","전승","missing","god",[],[],[new("출처","https://example.com","위치")],[]);Assert.Throws<InvalidDataException>(()=>SeedImporter.Validate(new([new("norse","북유럽")],[new("god","신")],[],[entry])));}
 [Test] public async Task CorsAllowsOnlyAppOrigin(){using var request=new HttpRequestMessage(HttpMethod.Get,"/health");request.Headers.Add("Origin","https://mythos.apps.tossmini.com");using var response=await client.SendAsync(request);Assert.That(response.Headers.GetValues("Access-Control-Allow-Origin").Single(),Is.EqualTo("https://mythos.apps.tossmini.com"));using var bad=new HttpRequestMessage(HttpMethod.Get,"/health");bad.Headers.Add("Origin","https://other.example");using var rejected=await client.SendAsync(bad);Assert.That(rejected.Headers.Contains("Access-Control-Allow-Origin"),Is.False);}
}

