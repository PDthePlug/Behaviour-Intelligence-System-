export type LearnerProfile = {
  id: string;
  firstName: string;
  surname: string;
  email: string;
  country: string;
  selectedPattern: string;
  profileStyle: string;
  deliveryEdition: "school" | "youth_programme" | "workplace";
  grade: string;
  programme: string;
  organisation: string;
  timeZone: string;
  authProvider: string;
  avatarUrl?: string | null;
  createdAt: number;
};

export type SavedResponse = {
  stepId: string;
  componentId: string;
  payload: unknown;
  isComplete: boolean;
  beiTarget?: string | null;
  measurementVersion?: string;
  evidenceClass?: string;
  updatedAt: number;
};

export type ResponseMap = Record<string, SavedResponse>;

export type SaveComponent = (
  stepId: string,
  componentId: string,
  payload: unknown,
  isComplete: boolean,
) => Promise<void>;
