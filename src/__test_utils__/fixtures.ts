import { DocumentResponse, DetailedDocumentResponse, DocumentRecord } from '@/api/types';

// Fallback Mock Data matching actual backend config/schema files

export const fallbackDocumentTypes: DocumentResponse[] = [
  {
    id: 'brands',
    title: 'Brands',
    type: 'collection',
    description: 'Brands of partners',
  },
  {
    id: 'partner-categories',
    title: 'PartnerCategory',
    type: 'collection',
    description: 'Categories of partner',
  },
  {
    id: 'partners',
    title: 'Partners',
    type: 'collection',
    description: 'Partners with unique IDNO and Legal Entity',
  },
  {
    id: 'points-of-sale',
    title: 'Points of sale',
    type: 'collection',
    description: 'Point of sale (concrete address)',
  },
];

export const fallbackDetailedDocumentTypes: Record<string, DetailedDocumentResponse> = {
  brands: {
    id: 'brands',
    title: 'Brands',
    type: 'collection',
    info: {
      title: 'Brands',
      description: 'Brands of partners',
      singularName: 'brand',
      pluralName: 'brands',
    },
    options: {
      draftAndPublish: true,
      localizations: ['en', 'ro'],
    },
    attributes: [
      { id: 'uid', type: 'uid', unique: true, required: true, constraints: [{ minimalLength: 4 }, { maximalLength: 10 }] },
      { id: 'name', type: 'text', unique: false, required: true, constraints: [] },
      { id: 'partners', relation: 'belongsToMany', target: 'partners' },
    ],
  },
  'partner-categories': {
    id: 'partner-categories',
    title: 'PartnerCategory',
    type: 'collection',
    info: {
      title: 'PartnerCategory',
      description: 'Categories of partner',
      singularName: 'partner-category',
      pluralName: 'partner-categories',
    },
    options: {
      draftAndPublish: true,
      localizations: ['en', 'ro', 'ru'],
    },
    attributes: [
      { id: 'uid', type: 'uid', unique: false, required: true },
      { id: 'name', type: 'localizedText', unique: false, required: true },
      { id: 'priority', type: 'integer', unique: true, required: true },
    ],
  },
  partners: {
    id: 'partners',
    title: 'Partners',
    type: 'collection',
    info: {
      title: 'Partners',
      description: 'Partners with unique IDNO and Legal Entity',
      singularName: 'partner',
      pluralName: 'partners',
    },
    options: {
      draftAndPublish: true,
      localizations: [],
    },
    attributes: [
      { id: 'idno', type: 'text', unique: true, required: true, constraints: [{ pattern: '^[0-9]{13}$' }] },
      { id: 'legal_entity', type: 'text', unique: true, required: true },
      { id: 'brands', relation: 'hasMany', target: 'brands' },
      { id: 'category', relation: 'hasOne', target: 'partner-categories' },
      { id: 'points-of-sale', relation: 'hasMany', target: 'points-of-sale' },
    ],
  },
  'points-of-sale': {
    id: 'points-of-sale',
    title: 'Points of sale',
    type: 'collection',
    info: {
      title: 'Points of sale',
      description: 'Point of sale (concrete address)',
      singularName: 'point-of-sale',
      pluralName: 'points-of-sale',
    },
    options: {
      draftAndPublish: true,
      localizations: ['en', 'ro', 'ru'],
    },
    attributes: [
      { id: 'title', type: 'text', unique: false, required: false },
      { id: 'location', type: 'text', unique: false, required: true },
      { id: 'latitude', type: 'decimal', unique: false, required: true },
      { id: 'longitude', type: 'decimal', unique: false, required: true },
      { id: 'partner', relation: 'belongsToOne', target: 'partners' },
    ],
  },
};

export const fallbackDocuments: Record<string, DocumentRecord[]> = {
  brands: [
    {
      id: 1,
      documentId: 'b1-uuid-1',
      uid: 'apple',
      name: { en: 'Apple Inc.', ro: 'Apple SRL' },
      createdAt: '2024-03-06T13:42:05.098Z',
      updatedAt: '2024-03-06T13:42:05.098Z',
      publishedAt: '2024-03-06T13:42:05.103Z',
    },
    {
      id: 2,
      documentId: 'b1-uuid-2',
      uid: 'samsung',
      name: { en: 'Samsung Electronics', ro: 'Samsung SRL' },
      createdAt: '2024-03-06T13:43:30.172Z',
      updatedAt: '2024-03-06T13:43:30.172Z',
      publishedAt: '2024-03-06T13:43:30.175Z',
    },
  ],
  'partner-categories': [
    {
      id: 1,
      documentId: 'pc-uuid-1',
      uid: 'retail',
      name: { en: 'Retail Trade', ro: 'Comerț cu amănuntul', ru: 'Розничная торговля' },
      priority: 1,
      createdAt: '2024-03-06T13:42:05.098Z',
      updatedAt: '2024-03-06T13:42:05.098Z',
      publishedAt: '2024-03-06T13:42:05.103Z',
    },
    {
      id: 2,
      documentId: 'pc-uuid-2',
      uid: 'horeca',
      name: { en: 'HoReCa', ro: 'Hoteluri, Restaurante, Cafenele', ru: 'Отели и рестораны' },
      priority: 2,
      createdAt: '2024-03-06T13:43:30.172Z',
      updatedAt: '2024-03-06T13:43:30.172Z',
      publishedAt: '2024-03-06T13:43:30.175Z',
    },
  ],
  partners: [
    {
      id: 1,
      documentId: 'p-uuid-1',
      idno: '1002600012345',
      legal_entity: "Andy's Pizza SRL",
      createdAt: '2024-03-06T13:42:05.098Z',
      updatedAt: '2024-03-06T13:42:05.098Z',
      publishedAt: '2024-03-06T13:42:05.103Z',
    },
    {
      id: 2,
      documentId: 'p-uuid-2',
      idno: '1003600067890',
      legal_entity: 'Moldtelecom SA',
      createdAt: '2024-03-06T13:43:30.172Z',
      updatedAt: '2024-03-06T13:43:30.172Z',
      publishedAt: null,
    },
  ],
  'points-of-sale': [
    {
      id: 1,
      documentId: 'pos-uuid-1',
      title: "Andy's Centru",
      location: { en: 'Stefan cel Mare 130', ro: 'Stefan cel Mare 130', ru: 'Штефан чел Маре 130' },
      latitude: 47.0245,
      longitude: 28.8322,
      createdAt: '2024-03-06T13:42:05.098Z',
      updatedAt: '2024-03-06T13:42:05.098Z',
      publishedAt: '2024-03-06T13:42:05.103Z',
    },
  ],
};
