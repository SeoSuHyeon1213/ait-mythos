import { useEffect, useState } from 'react';
export interface Lookup { id: string; name: string }
export interface EntryCard { slug: string; name: string; originalName: string; summary: string; culture: Lookup; category: Lookup; tags: Lookup[] }
export interface EntryDetail extends EntryCard { description: string; materialType: string; aliases: string[]; sources: { title: string; url: string; locator: string }[] }
export interface EntryPage { items: EntryCard[]; total: number; page: number; pageSize: number }
export interface Related { slug: string; name: string; kind: string }
export function useApi<T>(path: string) {
 const [state, setState] = useState<{ path: string; attempt?: number; data?: T; error?: string }>({path});
 const [attempt, setAttempt] = useState(0);
 useEffect(() => {
  const controller = new AbortController();
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  fetch(base + path, {signal: controller.signal}).then(async response => {
   if (!response.ok) throw new Error(response.status === 404 ? '항목을 찾을 수 없어요.' : '정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
   return response.json() as Promise<T>;
  }).then(data => setState({path, attempt, data})).catch((error: unknown) => {
   if (!controller.signal.aborted) setState({path, attempt, error: error instanceof Error ? error.message : '연결을 확인해 주세요.'});
  });
  return () => controller.abort();
 }, [path, attempt]);
 const current = state.path === path && state.attempt === attempt ? state : {path};
 return {...current, retry: () => setAttempt(x => x + 1)};
}
