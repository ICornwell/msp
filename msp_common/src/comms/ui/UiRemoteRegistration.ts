/**
 * A single level of scope identity.
 * Use '*' for name/version/variantName to express a wildcard at that field.
 */
export type ScopeItem = {
  name: string;
  version: string;
  variantName: string;
};

export type UiRemoteRegistration = {
  moduleName: string;
  remoteName: string;
  remoteFileName: string;
  remoteEntry: string;  // e.g., 'http://localhost:3001' for actorwork
  /**
   * Scope identity — set by service discovery from the manifest hierarchy.
   * Behaviours instantiated from this remote are stamped with this identity.
   * domain has no default; product/service/feature default to wildcard ('*').
   */
  scope?: {
    domain: ScopeItem;
    product?: ScopeItem;
    service?: ScopeItem;
    feature?: ScopeItem;
  };
};

export type UiRemoteIdentity = Omit<UiRemoteRegistration, 'remoteEntry'>;