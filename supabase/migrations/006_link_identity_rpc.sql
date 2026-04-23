-- Server-side helper for the `link-identity` edge function.
--
-- `auth.identities` isn't exposed through PostgREST, so the JS client can't insert
-- into it directly from an edge function. This SECURITY DEFINER RPC runs with
-- postgres privileges and performs the insert atomically, with conflict detection
-- so we don't accidentally cross-link identities between users.

CREATE OR REPLACE FUNCTION public.link_user_identity(
  p_user_id UUID,
  p_provider TEXT,
  p_provider_id TEXT,
  p_identity_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_existing_user_id UUID;
  v_identity_id UUID;
BEGIN
  SELECT user_id INTO v_existing_user_id
  FROM auth.identities
  WHERE provider = p_provider AND provider_id = p_provider_id;

  IF v_existing_user_id IS NOT NULL THEN
    IF v_existing_user_id = p_user_id THEN
      RETURN jsonb_build_object('status', 'already_linked');
    ELSE
      RETURN jsonb_build_object('status', 'in_use_by_other');
    END IF;
  END IF;

  INSERT INTO auth.identities (
    id, user_id, provider, provider_id, identity_data,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), p_user_id, p_provider, p_provider_id, p_identity_data,
    now(), now(), now()
  ) RETURNING id INTO v_identity_id;

  RETURN jsonb_build_object('status', 'linked', 'identity_id', v_identity_id);
END;
$$;

-- Only the service role can call this. Edge functions use the service role key.
REVOKE EXECUTE ON FUNCTION public.link_user_identity(UUID, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_user_identity(UUID, TEXT, TEXT, JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_user_identity(UUID, TEXT, TEXT, JSONB) TO service_role;
