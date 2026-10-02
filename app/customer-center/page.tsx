import FeatureSurface from '../../components/feature-surface';

export default function CustomerCenter(){
  return <FeatureSurface title="Customer Center" eyebrow="TRUST · CUSTOMER OS" description="Customer profile data from the authenticated customer API. No placeholder account metrics are rendered." endpoint="/api/customer/profile" />;
}
