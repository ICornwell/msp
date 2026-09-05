import type {
  ManifestServiceBuilder,
  TypedManifest,
  TypedServiceManifestSection,

} from 'msp_svr_common';
import { makeTypeVariants } from 'msp_svr_common';


const pamelaTypeVariants = makeTypeVariants('1.0.0') // version and variantName here will apply to all, unless overridden at the variant level
  .withActorTypeVariantSet()  // version and variantName here will apply to all actor variants, unless overridden at the variant level

   
    .endActorTypeVariantSet
  .withWorkTypeVariantSet() // version and variantName here will apply to all work variants, unless overridden at the variant level
  
   
    .endWorkTypeVariantSet
  .withLinkTypeVariantSet() // version and variantName here will apply to all link variants, unless overridden at the variant level
   
  
    
    .endLinkTypeVariantSet
  .endTypeVariants;





export function withPamelaActorWorkModel<
  TManifest extends TypedManifest,
  TService extends TypedServiceManifestSection,
>(builder: ManifestServiceBuilder<TManifest, TService>) {
  return builder.withTypeVariants(pamelaTypeVariants);
}
