import { useTranslations } from 'next-intl';
import Image from 'next/image';

import BackLink from '../../../../components/BackLink';
import PageLayout from '../../../../components/PageLayout';

export default function SettingsIntroPage() {
  const t = useTranslations('SettingsIntroPage');

  return (
    <PageLayout title={t('title')} before={<BackLink href="/settings">{t('backToSettings')}</BackLink>}>
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{t('purposeTitle')}</h2>
        <p className="text-background-contrary/80">{t('purposeIntro')}</p>
        <ul className="text-background-contrary/80 list-disc pl-6">
          <li>{t('purposeItem1')}</li>
          <li>{t('purposeItem2')}</li>
          <li>{t('purposeItem3')}</li>
          <li>{t('purposeItem4')}</li>
          <li>{t('purposeItem5')}</li>
        </ul>
        <p className="text-background-contrary/80">{t('purposeNote')}</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{t('techTitle')}</h2>
        <p className="text-background-contrary/80">{t('techIntro')}</p>
        <ul className="text-background-contrary/80 list-disc pl-6">
          <li>{t('techFrontend')}</li>
          <li>{t('techBackend')}</li>
          <li>{t('techDesign')}</li>
          <li>{t('techVisual')}</li>
        </ul>
        <Image src="/images/intro-figma.png" alt="Figma" width={1200} height={800} className="rounded-panel w-full" />
        <p className="text-background-contrary/80">{t('techNote')}</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">{t('problemTitle')}</h2>
        <p className="text-background-contrary/80">{t('problemIntro')}</p>
        <p className="text-background-contrary/80">{t('problemMethodsIntro')}</p>
        <ol className="text-background-contrary/80 list-decimal pl-6">
          <li>{t('problemMethod1')}</li>
          <li>{t('problemMethod2')}</li>
          <li>{t('problemMethod3')}</li>
        </ol>
        <Image src="/images/intro-gis.png" alt="GIS" width={1200} height={800} className="rounded-panel w-full" />
        <p className="text-background-contrary/80">{t('problemPainIntro')}</p>
        <ul className="text-background-contrary/80 list-disc pl-6">
          <li>{t('problemPain1')}</li>
          <li>{t('problemPain2')}</li>
          <li>{t('problemPain3')}</li>
        </ul>
        <p className="text-background-contrary/80">{t('problemConclusion')}</p>
      </section>
    </PageLayout>
  );
}
