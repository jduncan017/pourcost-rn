Test Plan

Touched auth context + signup + link-identity. Test priorities by risk:

Must pass (core flows)

1. Email sign-up — new email → see all 5 rules incl. "Passwords match" turn  
   green as you type → Create Account → onboarding
2. Email sign-in — existing email/pw works
3. Apple sign-in (new user) — Face ID → onboarding
4. Apple sign-in (existing user) — Face ID → straight to cocktails
5. Google sign-in (both new + existing)
6. Sign out — returns to landing
7. Cold boot signed in — app opens, lands on cocktails, correct role
8. Change password — settings → current+new → success → sign out → sign in
   with new pw  


Re-test (changes touched deletion + linking)

9. Delete account — happy path — Settings → Delete → type DELETE → confirm →  
   account gone, returned to landing. Try re-signing in: fail ✓
10. Delete account — failure path — kill wifi BEFORE tapping Delete Forever,  
    confirm → should see "Delete Failed" toast AND remain on settings screen still
    signed in. Re-enable wifi, retry → succeeds.
11. Link Apple (email-only account → Settings → Apple Sign-In → link) —  
    success toast, shows "Linked"
12. Link Google (same path)
13. Unlink Apple — must have another method linked first. Unlink → check  
    [Unlink] revoke-apple-token response: {"success":true,"revoked":true} in logs
14. Unlink Google — revokeAccess fires (Google's Apps page should no longer  
    show PourCost)  


Email verification

15. Fresh signup email verify card — sign up new email → Settings → Account →
    "Verify Email" card visible → tap → email arrives → tap link → web confirms →
    return to app → card disappears (on deep link, or within 60s of next  
    foreground)
16. Resend verify from settings — tap Verify Email card again → email arrives,
    no errors

Perf / regressions

17. Background/foreground spam — rapidly home-button → foreground app 10× in  
    20s → network inspector or console should show at most 1 refresh call
    (throttle working). Deep link should still refresh immediately.
18. Admin role — your account (emailjoshduncan@gmail.com) — open drawer,
    verify admin features still present
19. Hour-long session — leave app open 1+ hr, return, check console for any
    spurious fetchRole calls on token refresh (should see none)
20. Cross-device password change — sign in on device B, change pw on device A,
    device B's next API call gets booted (expected — new session invalidates old
    refresh token)

Deep regression check (untouched but adjacent)

21. Onboarding after Apple signup — full name carries into profile
22. Sample bar seeds on fresh signup (handle_new_user + sample seed still
    fires)
23. Forgot password (reset email → web page → new pw → sign in)
