import type {
  ActorTypeVariantManifestSection,
  LinkTypeVariantManifestSection,
  TypeVariantsManifestBlock,
  WorkTypeVariantManifestSection,
} from './manifest.js';

type Append<T extends readonly unknown[], TItem> = [...T, TItem];

type ActorProps<TName extends string, TVersion extends string, TVariantName extends string> =
  Omit<ActorTypeVariantManifestSection<TName, TVersion, TVariantName>, 'name' | 'version' | 'variantName'>;

type WorkProps<TName extends string, TVersion extends string, TVariantName extends string> =
  Omit<WorkTypeVariantManifestSection<TName, TVersion, TVariantName>, 'name' | 'version' | 'variantName'>;

type LinkProps<TName extends string, TVersion extends string, TVariantName extends string> =
  Omit<LinkTypeVariantManifestSection<TName, TVersion, TVariantName>, 'name' | 'version' | 'variantName'>;

export interface TypeVariantsBuilder<
  TActors extends readonly ActorTypeVariantManifestSection[] = [],
  TWorks extends readonly WorkTypeVariantManifestSection[] = [],
  TLinks extends readonly LinkTypeVariantManifestSection[] = [],
  TDefaultVersion extends string = '1.0.0',
  TDefaultVariantName extends string = 'default',
> {
  withActorTypeVariantSet<
    TSetVersion extends string = TDefaultVersion,
    TSetVariantName extends string = TDefaultVariantName,
  >(version?: TSetVersion, variantName?: TSetVariantName): ActorTypeVariantSetBuilder<
    TActors,
    TWorks,
    TLinks,
    TSetVersion,
    TSetVariantName,
    TDefaultVersion,
    TDefaultVariantName
  >;
  withWorkTypeVariantSet<
    TSetVersion extends string = TDefaultVersion,
    TSetVariantName extends string = TDefaultVariantName,
  >(version?: TSetVersion, variantName?: TSetVariantName): WorkTypeVariantSetBuilder<
    TActors,
    TWorks,
    TLinks,
    TSetVersion,
    TSetVariantName,
    TDefaultVersion,
    TDefaultVariantName
  >;
  withLinkTypeVariantSet<
    TSetVersion extends string = TDefaultVersion,
    TSetVariantName extends string = TDefaultVariantName,
  >(version?: TSetVersion, variantName?: TSetVariantName): LinkTypeVariantSetBuilder<
    TActors,
    TWorks,
    TLinks,
    TSetVersion,
    TSetVariantName,
    TDefaultVersion,
    TDefaultVariantName
  >;
  readonly endTypeVariants: {
    actorTypeVariants: TActors;
    workTypeVariants: TWorks;
    linkTypeVariants: TLinks;
  };
}

export interface ActorTypeVariantSetBuilder<
  TActors extends readonly ActorTypeVariantManifestSection[],
  TWorks extends readonly WorkTypeVariantManifestSection[],
  TLinks extends readonly LinkTypeVariantManifestSection[],
  TSetVersion extends string,
  TSetVariantName extends string,
  TDefaultVersion extends string,
  TDefaultVariantName extends string,
> {
  withActorTypeVariant<
    TName extends string,
    TVersion extends string = TSetVersion,
    TVariantName extends string = TSetVariantName,
  >(
    name: TName,
    version?: TVersion,
    variantName?: TVariantName,
  ): ActorTypeVariantPropertiesBuilder<
    TActors,
    TWorks,
    TLinks,
    TSetVersion,
    TSetVariantName,
    TDefaultVersion,
    TDefaultVariantName,
    TName,
    TVersion,
    TVariantName
  >;
  readonly endActorTypeVariantSet: TypeVariantsBuilder<
    TActors,
    TWorks,
    TLinks,
    TDefaultVersion,
    TDefaultVariantName
  >;
}

export interface ActorTypeVariantPropertiesBuilder<
  TActors extends readonly ActorTypeVariantManifestSection[],
  TWorks extends readonly WorkTypeVariantManifestSection[],
  TLinks extends readonly LinkTypeVariantManifestSection[],
  TSetVersion extends string,
  TSetVariantName extends string,
  TDefaultVersion extends string,
  TDefaultVariantName extends string,
  TName extends string,
  TVersion extends string,
  TVariantName extends string,
> {
  withProperties<TProps extends ActorProps<TName, TVersion, TVariantName>>(
    props: TProps,
  ): ActorTypeVariantSetBuilder<
    Append<TActors, ActorTypeVariantManifestSection<TName, TVersion, TVariantName> & TProps>,
    TWorks,
    TLinks,
    TSetVersion,
    TSetVariantName,
    TDefaultVersion,
    TDefaultVariantName
  >;
}

export interface WorkTypeVariantSetBuilder<
  TActors extends readonly ActorTypeVariantManifestSection[],
  TWorks extends readonly WorkTypeVariantManifestSection[],
  TLinks extends readonly LinkTypeVariantManifestSection[],
  TSetVersion extends string,
  TSetVariantName extends string,
  TDefaultVersion extends string,
  TDefaultVariantName extends string,
> {
  withWorkTypeVariant<
    TName extends string,
    TVersion extends string = TSetVersion,
    TVariantName extends string = TSetVariantName,
  >(
    name: TName,
    version?: TVersion,
    variantName?: TVariantName,
  ): WorkTypeVariantPropertiesBuilder<
    TActors,
    TWorks,
    TLinks,
    TSetVersion,
    TSetVariantName,
    TDefaultVersion,
    TDefaultVariantName,
    TName,
    TVersion,
    TVariantName
  >;
  readonly endWorkTypeVariantSet: TypeVariantsBuilder<
    TActors,
    TWorks,
    TLinks,
    TDefaultVersion,
    TDefaultVariantName
  >;
}

export interface WorkTypeVariantPropertiesBuilder<
  TActors extends readonly ActorTypeVariantManifestSection[],
  TWorks extends readonly WorkTypeVariantManifestSection[],
  TLinks extends readonly LinkTypeVariantManifestSection[],
  TSetVersion extends string,
  TSetVariantName extends string,
  TDefaultVersion extends string,
  TDefaultVariantName extends string,
  TName extends string,
  TVersion extends string,
  TVariantName extends string,
> {
  withProperties<TProps extends WorkProps<TName, TVersion, TVariantName>>(
    props: TProps,
  ): WorkTypeVariantSetBuilder<
    TActors,
    Append<TWorks, WorkTypeVariantManifestSection<TName, TVersion, TVariantName> & TProps>,
    TLinks,
    TSetVersion,
    TSetVariantName,
    TDefaultVersion,
    TDefaultVariantName
  >;
}

export interface LinkTypeVariantSetBuilder<
  TActors extends readonly ActorTypeVariantManifestSection[],
  TWorks extends readonly WorkTypeVariantManifestSection[],
  TLinks extends readonly LinkTypeVariantManifestSection[],
  TSetVersion extends string,
  TSetVariantName extends string,
  TDefaultVersion extends string,
  TDefaultVariantName extends string,
> {
  withLinkTypeVariant<
    TName extends string,
    TVersion extends string = TSetVersion,
    TVariantName extends string = TSetVariantName,
  >(
    name: TName,
    version?: TVersion,
    variantName?: TVariantName,
  ): LinkTypeVariantPropertiesBuilder<
    TActors,
    TWorks,
    TLinks,
    TSetVersion,
    TSetVariantName,
    TDefaultVersion,
    TDefaultVariantName,
    TName,
    TVersion,
    TVariantName
  >;
  readonly endLinkTypeVariantSet: TypeVariantsBuilder<
    TActors,
    TWorks,
    TLinks,
    TDefaultVersion,
    TDefaultVariantName
  >;
}

export interface LinkTypeVariantPropertiesBuilder<
  TActors extends readonly ActorTypeVariantManifestSection[],
  TWorks extends readonly WorkTypeVariantManifestSection[],
  TLinks extends readonly LinkTypeVariantManifestSection[],
  TSetVersion extends string,
  TSetVariantName extends string,
  TDefaultVersion extends string,
  TDefaultVariantName extends string,
  TName extends string,
  TVersion extends string,
  TVariantName extends string,
> {
  withProperties<TProps extends LinkProps<TName, TVersion, TVariantName>>(
    props: TProps,
  ): LinkTypeVariantSetBuilder<
    TActors,
    TWorks,
    Append<TLinks, LinkTypeVariantManifestSection<TName, TVersion, TVariantName> & TProps>,
    TSetVersion,
    TSetVariantName,
    TDefaultVersion,
    TDefaultVariantName
  >;
}

function makeRootBuilder<
  TActors extends readonly ActorTypeVariantManifestSection[],
  TWorks extends readonly WorkTypeVariantManifestSection[],
  TLinks extends readonly LinkTypeVariantManifestSection[],
  TDefaultVersion extends string,
  TDefaultVariantName extends string,
>(
  values: {
    actorTypeVariants: ActorTypeVariantManifestSection[];
    workTypeVariants: WorkTypeVariantManifestSection[];
    linkTypeVariants: LinkTypeVariantManifestSection[];
  },
  defaultVersion: TDefaultVersion,
  defaultVariantName: TDefaultVariantName,
): TypeVariantsBuilder<TActors, TWorks, TLinks, TDefaultVersion, TDefaultVariantName> {
  const root = {
    withActorTypeVariantSet: <TSetVersion extends string = TDefaultVersion, TSetVariantName extends string = TDefaultVariantName>(
      version?: TSetVersion,
      variantName?: TSetVariantName,
    ) => makeActorSetBuilder<TActors, TWorks, TLinks, TSetVersion, TSetVariantName, TDefaultVersion, TDefaultVariantName>(
      values,
      (version ?? defaultVersion) as TSetVersion,
      (variantName ?? defaultVariantName) as TSetVariantName,
      defaultVersion,
      defaultVariantName,
    ),
    withWorkTypeVariantSet: <TSetVersion extends string = TDefaultVersion, TSetVariantName extends string = TDefaultVariantName>(
      version?: TSetVersion,
      variantName?: TSetVariantName,
    ) => makeWorkSetBuilder<TActors, TWorks, TLinks, TSetVersion, TSetVariantName, TDefaultVersion, TDefaultVariantName>(
      values,
      (version ?? defaultVersion) as TSetVersion,
      (variantName ?? defaultVariantName) as TSetVariantName,
      defaultVersion,
      defaultVariantName,
    ),
    withLinkTypeVariantSet: <TSetVersion extends string = TDefaultVersion, TSetVariantName extends string = TDefaultVariantName>(
      version?: TSetVersion,
      variantName?: TSetVariantName,
    ) => makeLinkSetBuilder<TActors, TWorks, TLinks, TSetVersion, TSetVariantName, TDefaultVersion, TDefaultVariantName>(
      values,
      (version ?? defaultVersion) as TSetVersion,
      (variantName ?? defaultVariantName) as TSetVariantName,
      defaultVersion,
      defaultVariantName,
    ),
    get endTypeVariants() {
      return {
        actorTypeVariants: values.actorTypeVariants,
        workTypeVariants: values.workTypeVariants,
        linkTypeVariants: values.linkTypeVariants,
      } as unknown as {
        actorTypeVariants: TActors;
        workTypeVariants: TWorks;
        linkTypeVariants: TLinks;
      };
    },
  };

  return root as TypeVariantsBuilder<TActors, TWorks, TLinks, TDefaultVersion, TDefaultVariantName>;
}

function makeActorSetBuilder<
  TActors extends readonly ActorTypeVariantManifestSection[],
  TWorks extends readonly WorkTypeVariantManifestSection[],
  TLinks extends readonly LinkTypeVariantManifestSection[],
  TSetVersion extends string,
  TSetVariantName extends string,
  TDefaultVersion extends string,
  TDefaultVariantName extends string,
>(
  values: {
    actorTypeVariants: ActorTypeVariantManifestSection[];
    workTypeVariants: WorkTypeVariantManifestSection[];
    linkTypeVariants: LinkTypeVariantManifestSection[];
  },
  setVersion: TSetVersion,
  setVariantName: TSetVariantName,
  defaultVersion: TDefaultVersion,
  defaultVariantName: TDefaultVariantName,
): ActorTypeVariantSetBuilder<TActors, TWorks, TLinks, TSetVersion, TSetVariantName, TDefaultVersion, TDefaultVariantName> {
  const setBuilder = {
    withActorTypeVariant: <TName extends string, TVersion extends string = TSetVersion, TVariantName extends string = TSetVariantName>(
      name: TName,
      version?: TVersion,
      variantName?: TVariantName,
    ) => {
      const resolvedVersion = (version ?? setVersion) as TVersion;
      const resolvedVariantName = (variantName ?? setVariantName) as TVariantName;
      return {
        withProperties: <TProps extends ActorProps<TName, TVersion, TVariantName>>(props: TProps) => {
          values.actorTypeVariants.push({
            name,
            version: resolvedVersion,
            variantName: resolvedVariantName,
            ...props,
          } as ActorTypeVariantManifestSection);

          return makeActorSetBuilder<
            Append<TActors, ActorTypeVariantManifestSection<TName, TVersion, TVariantName> & TProps>,
            TWorks,
            TLinks,
            TSetVersion,
            TSetVariantName,
            TDefaultVersion,
            TDefaultVariantName
          >(values, setVersion, setVariantName, defaultVersion, defaultVariantName);
        },
      } as ActorTypeVariantPropertiesBuilder<
        TActors,
        TWorks,
        TLinks,
        TSetVersion,
        TSetVariantName,
        TDefaultVersion,
        TDefaultVariantName,
        TName,
        TVersion,
        TVariantName
      >;
    },
    get endActorTypeVariantSet() {
      return makeRootBuilder<TActors, TWorks, TLinks, TDefaultVersion, TDefaultVariantName>(
        values,
        defaultVersion,
        defaultVariantName,
      );
    },
  };

  return setBuilder as ActorTypeVariantSetBuilder<TActors, TWorks, TLinks, TSetVersion, TSetVariantName, TDefaultVersion, TDefaultVariantName>;
}

function makeWorkSetBuilder<
  TActors extends readonly ActorTypeVariantManifestSection[],
  TWorks extends readonly WorkTypeVariantManifestSection[],
  TLinks extends readonly LinkTypeVariantManifestSection[],
  TSetVersion extends string,
  TSetVariantName extends string,
  TDefaultVersion extends string,
  TDefaultVariantName extends string,
>(
  values: {
    actorTypeVariants: ActorTypeVariantManifestSection[];
    workTypeVariants: WorkTypeVariantManifestSection[];
    linkTypeVariants: LinkTypeVariantManifestSection[];
  },
  setVersion: TSetVersion,
  setVariantName: TSetVariantName,
  defaultVersion: TDefaultVersion,
  defaultVariantName: TDefaultVariantName,
): WorkTypeVariantSetBuilder<TActors, TWorks, TLinks, TSetVersion, TSetVariantName, TDefaultVersion, TDefaultVariantName> {
  const setBuilder = {
    withWorkTypeVariant: <TName extends string, TVersion extends string = TSetVersion, TVariantName extends string = TSetVariantName>(
      name: TName,
      version?: TVersion,
      variantName?: TVariantName,
    ) => {
      const resolvedVersion = (version ?? setVersion) as TVersion;
      const resolvedVariantName = (variantName ?? setVariantName) as TVariantName;
      return {
        withProperties: <TProps extends WorkProps<TName, TVersion, TVariantName>>(props: TProps) => {
          values.workTypeVariants.push({
            name,
            version: resolvedVersion,
            variantName: resolvedVariantName,
            ...props,
          } as WorkTypeVariantManifestSection);

          return makeWorkSetBuilder<
            TActors,
            Append<TWorks, WorkTypeVariantManifestSection<TName, TVersion, TVariantName> & TProps>,
            TLinks,
            TSetVersion,
            TSetVariantName,
            TDefaultVersion,
            TDefaultVariantName
          >(values, setVersion, setVariantName, defaultVersion, defaultVariantName);
        },
      } as WorkTypeVariantPropertiesBuilder<
        TActors,
        TWorks,
        TLinks,
        TSetVersion,
        TSetVariantName,
        TDefaultVersion,
        TDefaultVariantName,
        TName,
        TVersion,
        TVariantName
      >;
    },
    get endWorkTypeVariantSet() {
      return makeRootBuilder<TActors, TWorks, TLinks, TDefaultVersion, TDefaultVariantName>(
        values,
        defaultVersion,
        defaultVariantName,
      );
    },
  };

  return setBuilder as WorkTypeVariantSetBuilder<TActors, TWorks, TLinks, TSetVersion, TSetVariantName, TDefaultVersion, TDefaultVariantName>;
}

function makeLinkSetBuilder<
  TActors extends readonly ActorTypeVariantManifestSection[],
  TWorks extends readonly WorkTypeVariantManifestSection[],
  TLinks extends readonly LinkTypeVariantManifestSection[],
  TSetVersion extends string,
  TSetVariantName extends string,
  TDefaultVersion extends string,
  TDefaultVariantName extends string,
>(
  values: {
    actorTypeVariants: ActorTypeVariantManifestSection[];
    workTypeVariants: WorkTypeVariantManifestSection[];
    linkTypeVariants: LinkTypeVariantManifestSection[];
  },
  setVersion: TSetVersion,
  setVariantName: TSetVariantName,
  defaultVersion: TDefaultVersion,
  defaultVariantName: TDefaultVariantName,
): LinkTypeVariantSetBuilder<TActors, TWorks, TLinks, TSetVersion, TSetVariantName, TDefaultVersion, TDefaultVariantName> {
  const setBuilder = {
    withLinkTypeVariant: <TName extends string, TVersion extends string = TSetVersion, TVariantName extends string = TSetVariantName>(
      name: TName,
      version?: TVersion,
      variantName?: TVariantName,
    ) => {
      const resolvedVersion = (version ?? setVersion) as TVersion;
      const resolvedVariantName = (variantName ?? setVariantName) as TVariantName;
      return {
        withProperties: <TProps extends LinkProps<TName, TVersion, TVariantName>>(props: TProps) => {
          values.linkTypeVariants.push({
            name,
            version: resolvedVersion,
            variantName: resolvedVariantName,
            ...props,
          } as LinkTypeVariantManifestSection);

          return makeLinkSetBuilder<
            TActors,
            TWorks,
            Append<TLinks, LinkTypeVariantManifestSection<TName, TVersion, TVariantName> & TProps>,
            TSetVersion,
            TSetVariantName,
            TDefaultVersion,
            TDefaultVariantName
          >(values, setVersion, setVariantName, defaultVersion, defaultVariantName);
        },
      } as LinkTypeVariantPropertiesBuilder<
        TActors,
        TWorks,
        TLinks,
        TSetVersion,
        TSetVariantName,
        TDefaultVersion,
        TDefaultVariantName,
        TName,
        TVersion,
        TVariantName
      >;
    },
    get endLinkTypeVariantSet() {
      return makeRootBuilder<TActors, TWorks, TLinks, TDefaultVersion, TDefaultVariantName>(
        values,
        defaultVersion,
        defaultVariantName,
      );
    },
  };

  return setBuilder as LinkTypeVariantSetBuilder<TActors, TWorks, TLinks, TSetVersion, TSetVariantName, TDefaultVersion, TDefaultVariantName>;
}

export function makeTypeVariants<
  TDefaultVersion extends string = '1.0.0',
  TDefaultVariantName extends string = 'default',
>(
  defaultVersion?: TDefaultVersion,
  defaultVariantName?: TDefaultVariantName,
): TypeVariantsBuilder<[], [], [], TDefaultVersion, TDefaultVariantName> {
  return makeRootBuilder<[], [], [], TDefaultVersion, TDefaultVariantName>(
    {
      actorTypeVariants: [],
      workTypeVariants: [],
      linkTypeVariants: [],
    },
    (defaultVersion ?? '1.0.0') as TDefaultVersion,
    (defaultVariantName ?? 'default') as TDefaultVariantName,
  );
}

export function toTypeVariantsManifestBlock(
  builder: TypeVariantsBuilder<any, any, any, any, any>,
): TypeVariantsManifestBlock {
  return builder.endTypeVariants;
}
