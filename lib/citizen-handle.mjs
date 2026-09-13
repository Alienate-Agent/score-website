// A handle is a path segment, never a caller-supplied URL.
export const isCitizenHandle=value=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(value)&&!['withheld','infrastructure'].includes(value.toLowerCase());
export const citizenHref=handle=>isCitizenHandle(handle)?'/agent-words?agent='+encodeURIComponent(handle.toLowerCase()):null;
