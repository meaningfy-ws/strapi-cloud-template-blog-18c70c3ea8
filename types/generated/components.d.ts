import type { Schema, Struct } from '@strapi/strapi';

export interface LandingAudienceCard extends Struct.ComponentSchema {
  collectionName: 'components_landing_audience_cards';
  info: {
    description: 'Audience segment card \u2014 icon, split-title, body, signup-link with role';
    displayName: 'Audience Card';
    icon: 'user-circle';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    iconEmoji: Schema.Attribute.String;
    linkHref: Schema.Attribute.String & Schema.Attribute.Required;
    linkLabel: Schema.Attribute.String & Schema.Attribute.Required;
    role: Schema.Attribute.Enumeration<
      ['expeditor', 'transportator', 'ambele']
    > &
      Schema.Attribute.Required;
    titleEmphasis: Schema.Attribute.String & Schema.Attribute.Required;
    titleLead: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LandingFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_landing_faq_items';
  info: {
    description: 'Question + richtext answer (supports inline links)';
    displayName: 'FAQ Item';
    icon: 'question';
  };
  attributes: {
    answer: Schema.Attribute.RichText & Schema.Attribute.Required;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LandingFooter extends Struct.ComponentSchema {
  collectionName: 'components_landing_footers';
  info: {
    description: 'Site footer \u2014 brand block, link columns, bottom lines';
    displayName: 'Footer';
    icon: 'align-justify';
  };
  attributes: {
    columns: Schema.Attribute.Component<'landing.footer-column', true>;
    copyrightText: Schema.Attribute.String & Schema.Attribute.Required;
    locationLine: Schema.Attribute.String;
    logoAccent: Schema.Attribute.String;
    logoMark: Schema.Attribute.String;
    logoText: Schema.Attribute.String & Schema.Attribute.Required;
    tagline: Schema.Attribute.Text;
  };
}

export interface LandingFooterColumn extends Struct.ComponentSchema {
  collectionName: 'components_landing_footer_columns';
  info: {
    description: 'A footer link column (title + links)';
    displayName: 'Footer Column';
    icon: 'list';
  };
  attributes: {
    links: Schema.Attribute.Component<'shared.link', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LandingHero extends Struct.ComponentSchema {
  collectionName: 'components_landing_heroes';
  info: {
    description: 'Hero block with split-title, primary CTA and postcard illustration content';
    displayName: 'Hero';
    icon: 'rocket';
  };
  attributes: {
    eyebrow: Schema.Attribute.String;
    handwrittenLines: Schema.Attribute.Component<'landing.postcard-line', true>;
    postmarkCity: Schema.Attribute.String;
    postmarkLabel: Schema.Attribute.String;
    postmarkYear: Schema.Attribute.String;
    primaryCtaHref: Schema.Attribute.String & Schema.Attribute.Required;
    primaryCtaLabel: Schema.Attribute.String & Schema.Attribute.Required;
    routeFromCity: Schema.Attribute.String;
    routeFromMeta: Schema.Attribute.String;
    routeToCity: Schema.Attribute.String;
    routeToMeta: Schema.Attribute.String;
    socialProofText: Schema.Attribute.String;
    stampGlyph: Schema.Attribute.String;
    stampLabel: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    titleEmphasis: Schema.Attribute.String & Schema.Attribute.Required;
    titleLead: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LandingNav extends Struct.ComponentSchema {
  collectionName: 'components_landing_navs';
  info: {
    description: 'Fixed top navigation \u2014 logo + single CTA';
    displayName: 'Nav';
    icon: 'compass';
  };
  attributes: {
    ctaHref: Schema.Attribute.String & Schema.Attribute.Required;
    ctaLabel: Schema.Attribute.String & Schema.Attribute.Required;
    logoAccent: Schema.Attribute.String;
    logoMark: Schema.Attribute.String;
    logoText: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LandingNumberedCard extends Struct.ComponentSchema {
  collectionName: 'components_landing_numbered_cards';
  info: {
    description: 'Numbered problem card with title + body';
    displayName: 'Numbered Card';
    icon: 'list-ol';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    number: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LandingPostcardLine extends Struct.ComponentSchema {
  collectionName: 'components_landing_postcard_lines';
  info: {
    description: 'A single italic line on the hero postcard illustration';
    displayName: 'Postcard Line';
    icon: 'quote-right';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LandingRoleOption extends Struct.ComponentSchema {
  collectionName: 'components_landing_role_options';
  info: {
    description: 'Single role radio option in the signup form';
    displayName: 'Role Option';
    icon: 'list';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.Enumeration<
      ['expeditor', 'transportator', 'ambele']
    > &
      Schema.Attribute.Required;
  };
}

export interface LandingSectionAudience extends Struct.ComponentSchema {
  collectionName: 'components_landing_section_audiences';
  info: {
    description: 'Who-is-this-for section \u2014 label, split-title, audience cards';
    displayName: 'Section \u2014 Audience';
    icon: 'users';
  };
  attributes: {
    cards: Schema.Attribute.Component<'landing.audience-card', true>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    titleEmphasis: Schema.Attribute.String & Schema.Attribute.Required;
    titleLead: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LandingSectionFaq extends Struct.ComponentSchema {
  collectionName: 'components_landing_section_faqs';
  info: {
    description: 'FAQ section \u2014 label, split-title (with optional trail), repeatable items';
    displayName: 'Section \u2014 FAQ';
    icon: 'question-circle';
  };
  attributes: {
    items: Schema.Attribute.Component<'landing.faq-item', true>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    titleEmphasis: Schema.Attribute.String & Schema.Attribute.Required;
    titleLead: Schema.Attribute.String & Schema.Attribute.Required;
    titleTrail: Schema.Attribute.String;
  };
}

export interface LandingSectionHow extends Struct.ComponentSchema {
  collectionName: 'components_landing_section_hows';
  info: {
    description: 'How-it-works section \u2014 label, split-title, intro, steps, closing note';
    displayName: 'Section \u2014 How it works';
    icon: 'sitemap';
  };
  attributes: {
    intro: Schema.Attribute.Text;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    note: Schema.Attribute.Text;
    steps: Schema.Attribute.Component<'landing.step', true>;
    titleEmphasis: Schema.Attribute.String & Schema.Attribute.Required;
    titleLead: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LandingSectionProblem extends Struct.ComponentSchema {
  collectionName: 'components_landing_section_problems';
  info: {
    description: 'Dark problem section \u2014 label, split-title, intro, numbered cards';
    displayName: 'Section \u2014 Problem';
    icon: 'exclamation-triangle';
  };
  attributes: {
    cards: Schema.Attribute.Component<'landing.numbered-card', true>;
    intro: Schema.Attribute.Text;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    titleEmphasis: Schema.Attribute.String & Schema.Attribute.Required;
    titleLead: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LandingSectionSignup extends Struct.ComponentSchema {
  collectionName: 'components_landing_section_signups';
  info: {
    description: 'Waitlist signup section \u2014 section copy, form copy, role options, success state';
    displayName: 'Section \u2014 Signup';
    icon: 'envelope';
  };
  attributes: {
    contactLabel: Schema.Attribute.String & Schema.Attribute.Required;
    contactPlaceholder: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    nameHint: Schema.Attribute.String;
    nameLabel: Schema.Attribute.String & Schema.Attribute.Required;
    namePlaceholder: Schema.Attribute.String;
    privacyNote: Schema.Attribute.Text;
    roleDefault: Schema.Attribute.Enumeration<
      ['expeditor', 'transportator', 'ambele']
    > &
      Schema.Attribute.DefaultTo<'expeditor'>;
    roleLabel: Schema.Attribute.String & Schema.Attribute.Required;
    roleOptions: Schema.Attribute.Component<'landing.role-option', true>;
    routeHint: Schema.Attribute.String;
    routeLabel: Schema.Attribute.String & Schema.Attribute.Required;
    routePlaceholder: Schema.Attribute.String;
    submitLabel: Schema.Attribute.String & Schema.Attribute.Required;
    successMessage: Schema.Attribute.Text & Schema.Attribute.Required;
    successTitle: Schema.Attribute.String & Schema.Attribute.Required;
    titleEmphasis: Schema.Attribute.String & Schema.Attribute.Required;
    titleLead: Schema.Attribute.String & Schema.Attribute.Required;
    titleTrail: Schema.Attribute.String;
  };
}

export interface LandingSectionTrust extends Struct.ComponentSchema {
  collectionName: 'components_landing_section_trusts';
  info: {
    description: 'Why-us section \u2014 label, split-title, trust items';
    displayName: 'Section \u2014 Trust';
    icon: 'shield';
  };
  attributes: {
    items: Schema.Attribute.Component<'landing.trust-item', true>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    titleEmphasis: Schema.Attribute.String & Schema.Attribute.Required;
    titleLead: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LandingStep extends Struct.ComponentSchema {
  collectionName: 'components_landing_steps';
  info: {
    description: 'Numbered step with title + body';
    displayName: 'Step';
    icon: 'arrow-right';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    number: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface LandingTrustItem extends Struct.ComponentSchema {
  collectionName: 'components_landing_trust_items';
  info: {
    description: 'Single glyph + title + body pair inside the Trust section';
    displayName: 'Trust Item';
    icon: 'check-circle';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    glyph: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    description: 'A label + href pair, optionally external';
    displayName: 'Link';
    icon: 'link';
  };
  attributes: {
    external: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    href: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'landing.audience-card': LandingAudienceCard;
      'landing.faq-item': LandingFaqItem;
      'landing.footer': LandingFooter;
      'landing.footer-column': LandingFooterColumn;
      'landing.hero': LandingHero;
      'landing.nav': LandingNav;
      'landing.numbered-card': LandingNumberedCard;
      'landing.postcard-line': LandingPostcardLine;
      'landing.role-option': LandingRoleOption;
      'landing.section-audience': LandingSectionAudience;
      'landing.section-faq': LandingSectionFaq;
      'landing.section-how': LandingSectionHow;
      'landing.section-problem': LandingSectionProblem;
      'landing.section-signup': LandingSectionSignup;
      'landing.section-trust': LandingSectionTrust;
      'landing.step': LandingStep;
      'landing.trust-item': LandingTrustItem;
      'shared.link': SharedLink;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
    }
  }
}
