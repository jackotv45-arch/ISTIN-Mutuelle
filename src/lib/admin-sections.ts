export type EditableSectionKey =
  | "finances"
  | "inscriptions"
  | "propositions"
  | "sondages"
  | "medias"
  | "bureau"
  | "rapports"
  | "demandes"
  | "parametres";

export type EditableSectionItem = {
  id: string;
  title: string;
  value: string;
  details: string;
  image?: string;
};

export type EditableSectionDocument = {
  intro: string;
  items: EditableSectionItem[];
};

export const editableSectionTitles: Record<EditableSectionKey, string> = {
  finances: "Finances",
  inscriptions: "Inscriptions",
  propositions: "Propositions",
  sondages: "Sondages",
  medias: "Médias",
  bureau: "Bureau",
  rapports: "Rapports",
  demandes: "Demandes",
  parametres: "Paramètres",
};

export const editableSectionDefaults: Record<EditableSectionKey, EditableSectionDocument> = {
  finances: {
    intro: "Les informations financières validées par le bureau de la mutuelle seront publiées ici.",
    items: [],
  },
  inscriptions: {
    intro: "Les inscriptions étudiantes aux événements apparaîtront ici.",
    items: [],
  },
  propositions: {
    intro: "Les propositions déposées par les étudiants apparaîtront ici.",
    items: [],
  },
  sondages: {
    intro: "Les sondages ouverts par la mutuelle apparaîtront ici.",
    items: [],
  },
  medias: {
    intro: "Photos de la communauté et des espaces de l’ISTIN.",
    items: [
      { id: "media-campus", title: "Vie étudiante à l’ISTIN", value: "Photo", details: "Photo issue des images fournies pour le site.", image: "/images/pro/hero-2.jpg" },
      { id: "media-salon", title: "Salon étudiant", value: "Photo", details: "Photo issue des images fournies pour le site.", image: "/images/Istin_salon_etudiant.jpg" },
      { id: "media-campus-space", title: "Espaces de l’ISTIN", value: "Photo", details: "Photo issue des images fournies pour le site.", image: "/images/salle_istin.jpg" },
    ],
  },
  bureau: {
    intro: "Les membres actuels du bureau et leurs responsabilités seront présentés ici.",
    items: [],
  },
  rapports: {
    intro: "Les rapports validés par les responsables seront publiés ici.",
    items: [],
  },
  demandes: {
    intro: "Les demandes adressées à la mutuelle seront suivies ici.",
    items: [],
  },
  parametres: {
    intro:
      "Renseigne ici les informations publiques du site (coordonnées, horaires). Les champs vides restent cachés sur le site public.",
    items: [
      {
        id: "contact-email",
        title: "Adresse e-mail",
        value: "",
        details: "Adresse de contact officielle de la mutuelle.",
      },
      {
        id: "contact-phone",
        title: "Téléphone",
        value: "",
        details: "Numéro joignable par les étudiants.",
      },
      {
        id: "contact-address",
        title: "Adresse",
        value: "",
        details: "Lieu de rencontre ou adresse postale si applicable.",
      },
      {
        id: "contact-hours",
        title: "Horaires",
        value: "",
        details: "Créneaux de permanence du bureau.",
      },
    ],
  },
};


export function sectionSettingKey(key: EditableSectionKey) {
  return "admin.section." + key;
}

export function isEditableSectionDocument(value: unknown): value is EditableSectionDocument {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<EditableSectionDocument> & { isExample?: unknown };
  return typeof candidate.intro === "string"
    && Array.isArray(candidate.items)
    && candidate.items.every((item) => item
      && typeof item.id === "string"
      && typeof item.title === "string"
      && typeof item.value === "string"
      && typeof item.details === "string"
      && (item.image === undefined || typeof item.image === "string"));
}

export function normalizeEditableSectionDocument(key: EditableSectionKey, value: unknown): EditableSectionDocument {
  if (!isEditableSectionDocument(value)) return editableSectionDefaults[key];
  const legacy = value as EditableSectionDocument & { isExample?: boolean };
  if (legacy.isExample === true) return editableSectionDefaults[key];
  return { intro: legacy.intro, items: legacy.items };
}