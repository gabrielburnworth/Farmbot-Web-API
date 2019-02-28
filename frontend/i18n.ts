import axios from "axios";
import { InitOptions } from "i18next";

/** @public */
export function generateUrl(langCode: string, host: string, port: string) {
  const lang = langCode.slice(0, 2);
  const baseUrl = `//${host.split(":")[0]}:${port}`;
  const url = `${baseUrl}/app-resources/languages/${lang}.js`;
  return url;
}

export function getUserLang(
  langCode = "en_us", host = location.host, port = location.port) {
  return axios.get(generateUrl(langCode, host, port))
    .then(() => langCode.slice(0, 2))
    .catch(() => "en");
}

const parseTranslationData = (data: string) =>
  JSON.parse(data.substring(data.indexOf("{")).replace(/(^\s*\/\/.*)/gm, ""));

export function generateI18nConfig(lang: string): Promise<InitOptions> {
  return axios
    .get<string>(`/app-resources/languages/${lang}.js`)
    .then(response => {
      const translation = parseTranslationData(response.data);
      return {
        nsSeparator: "",
        keySeparator: "",
        lng: lang,
        resources: { [lang]: { translation } }
      };
    });
}

export const detectLanguage =
  (lang = navigator.language) => getUserLang(lang).then(generateI18nConfig);
