export function accountAppLink(action:'verify'|'reset',token:string,fallback:string):string|null {
  if(!/^[a-f0-9]{64}$/.test(token))return null;
  let url:URL;
  try{url=new URL(fallback);}catch{return null;}
  if(url.protocol!=='https:'||url.origin!=='https://mybetliveadmin.pages.dev')return null;
  return `intent://auth/${action}?token=${token}#Intent;scheme=mybetlive;package=com.mybetlive;S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
}
