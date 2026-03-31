/**
 * @module test-data/rockaway-beach-fixture
 * Typed Four Corners metadata fixture derived from rockaway-beach.json.
 * The base64 mainImage is replaced with a tiny placeholder to keep tests fast.
 */

/** A context item (photograph) in the Four Corners metadata. */
export interface FourCornersContextItem {
  id: string;
  caption: string;
  description: string | null;
  credit: string | null;
  filename: string;
  date: string | null;
  type: 'image' | 'video' | 'audio';
  sourceType: 'upload' | 'url';
  storage_url: string | null;
  thumbnail_storage_url: string | null;
  url: string | null;
}

/** A link in the Four Corners metadata. */
export interface FourCornersLink {
  title: string;
  url: string;
  source: string;
}

/** Ethics declarations. */
export interface FourCornersEthics {
  customEthicsText: string;
  noManipulation: boolean;
  manipulationDetails: string;
  noStaging: boolean;
  stagingDetails: string;
  informedConsent: boolean;
  consentDetails: string;
  identityProtected: boolean;
  identityProtectionDetails: string;
  aiAltered: boolean;
  aiAlteredDetails: string;
}

/** Photo metadata (equipment, EXIF, etc.). */
export interface FourCornersPhotoMetadata {
  equipment: {
    cameraMake: string;
    cameraModel: string;
  };
}

/** Full Four Corners metadata document. */
export interface FourCornersMetadata {
  backStory: {
    text: string;
    author: string;
    date: string;
  };
  context: FourCornersContextItem[];
  links: FourCornersLink[];
  creativeCommons: {
    copyright: string;
    description: string;
  };
  _ext: {
    ethics: FourCornersEthics;
    photoMetadata: FourCornersPhotoMetadata;
    mainImage: string;
  };
}

/** 1x1 transparent PNG as placeholder for the mainImage in tests. */
const PLACEHOLDER_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Trimmed test fixture based on rockaway-beach.json.
 * Contains all metadata sections with real data except the mainImage,
 * which is replaced with a tiny placeholder.
 */
export const rockawayBeachFixture: FourCornersMetadata = {
  backStory: {
    text: "It was a unique thing to me because I think I've never seen in my whole life a beach and such a huge space with so much snow and hearing the waves, the noise from the sea, actually the ocean with the feeling of the snow basically stinging my face was a rare thing.",
    author: '',
    date: '2026-01-26',
  },
  context: [
    {
      id: '65d2d6a5-ba4b-4ddc-ba6f-cadd6b911ee9',
      caption: '',
      description: null,
      credit: null,
      filename: 'Pedrani_250126_0595-8.jpg',
      date: null,
      type: 'image',
      sourceType: 'upload',
      storage_url: null,
      thumbnail_storage_url: null,
      url: null,
    },
    {
      id: '2629a338-8c19-4f9f-848a-c5d16781d114',
      caption: '',
      description: null,
      credit: null,
      filename: 'Pedrani_250126_0339-28.jpg',
      date: null,
      type: 'image',
      sourceType: 'upload',
      storage_url: null,
      thumbnail_storage_url: null,
      url: null,
    },
    {
      id: '6457cf79-f772-42cf-8fe1-96169e8b867a',
      caption: '',
      description: null,
      credit: null,
      filename: 'Pedrani_250126_0186-23.jpg',
      date: null,
      type: 'image',
      sourceType: 'upload',
      storage_url: null,
      thumbnail_storage_url: null,
      url: null,
    },
    {
      id: '7dcfba5f-770e-4a27-8120-8831a6cb8db0',
      caption: '',
      description: null,
      credit: null,
      filename: 'Pedrani_250126_0159-25.jpg',
      date: null,
      type: 'image',
      sourceType: 'upload',
      storage_url: null,
      thumbnail_storage_url: null,
      url: null,
    },
    {
      id: 'a0f40e71-bb95-4261-9bb6-23f3f4b7d9f6',
      caption: '',
      description: null,
      credit: null,
      filename: '260125_Rockaway-009-positive-33.jpg',
      date: null,
      type: 'image',
      sourceType: 'upload',
      storage_url: null,
      thumbnail_storage_url: null,
      url: null,
    },
    {
      id: 'b7a99833-f376-4413-988c-517f76affd64',
      caption: '',
      description: null,
      credit: null,
      filename: '260125_Rockaway-003-positive-30.jpg',
      date: null,
      type: 'image',
      sourceType: 'upload',
      storage_url: null,
      thumbnail_storage_url: null,
      url: null,
    },
  ],
  links: [
    {
      title:
        'Economic damages from Hurricane Sandy attributable to sea level rise caused by anthropogenic climate change',
      url: 'https://www.nature.com/articles/s41467-021-22838-1',
      source: '',
    },
    {
      title: 'New York Is Going to Flood',
      url: 'https://www.nytimes.com/interactive/2025/10/15/nyregion/new-york-climate-flooding-solutions.html?searchResultPosition=3',
      source: '',
    },
    {
      title: 'Cuomo Seeking Home Buyouts in Flood Zones',
      url: 'https://www.nytimes.com/2013/02/04/nyregion/cuomo-seeking-home-buyouts-in-flood-zones.html',
      source: '',
    },
    {
      title: 'The Homeric hymns (to Selene, p.125)',
      url: 'https://ia600305.us.archive.org/26/items/homerichymns00edgaiala/homerichymns00edgaiala.pdf?referrer=grok.com',
      source: '',
    },
  ],
  creativeCommons: {
    copyright: 'Elisa Pedrani',
    description:
      'Rockaway Beach 97 St, NYC, a man is contemplating the ocean during the snowstorm, 25 January 2026.',
  },
  _ext: {
    ethics: {
      customEthicsText: '',
      noManipulation: false,
      manipulationDetails: '',
      noStaging: false,
      stagingDetails: '',
      informedConsent: false,
      consentDetails: '',
      identityProtected: false,
      identityProtectionDetails: '',
      aiAltered: false,
      aiAlteredDetails: '',
    },
    photoMetadata: {
      equipment: {
        cameraMake: 'Canon',
        cameraModel: 'Canon EOS RP',
      },
    },
    mainImage: PLACEHOLDER_IMAGE,
  },
};
