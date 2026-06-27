import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import PlacesScreen from "../../../src/features/places/PlacesScreen";

export default function VehicleServicesScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t("services.title") }} />
      <PlacesScreen />
    </>
  );
}
