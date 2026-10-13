import { describe,it,expect } from 'vitest';
import { accountAppLink } from './account-links';
describe('Account app links',()=>{
  const token='a'.repeat(64);
  it('targets our Android package and preserves an HTTPS fallback',()=>{
    const link=accountAppLink('reset',token,`https://mybetliveadmin.pages.dev/reset-password?token=${token}`)!;
    expect(link).toContain('intent://auth/reset?token=');expect(link).toContain('package=com.mybetlive;');expect(link).toContain('S.browser_fallback_url=https%3A');
  });
  it('rejects token injection and untrusted fallbacks',()=>{
    expect(accountAppLink('verify','x;package=com.evil','https://mybetliveadmin.pages.dev/verify-email')).toBeNull();
    expect(accountAppLink('verify',token,'https://evil.test/verify-email')).toBeNull();
  });
});
