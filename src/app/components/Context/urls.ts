import { IUrlEntry } from "./UrlButton";

export type Url = {
  url: string;
  title: string;
  seeded: boolean;
  loading: boolean;
};

export const urls: IUrlEntry[] = [];
