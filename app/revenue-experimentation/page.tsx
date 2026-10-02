import FeatureSurface from '../../components/feature-surface';
import { FEATURE_SURFACES } from '../../modules/platform/feature-surfaces';

export default function FeaturePage(){
  const feature = FEATURE_SURFACES['/revenue-experimentation'];
  return <FeatureSurface title={feature.title} eyebrow={feature.eyebrow} description={feature.description} endpoint={feature.endpoint} />;
}
