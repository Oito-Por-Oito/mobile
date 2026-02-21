import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "gamecontroller.fill": "sports-esports",
  "puzzlepiece.fill": "extension",
  "book.fill": "menu-book",
  "ellipsis": "more-horiz",
  // Actions
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "xmark": "close",
  "plus": "add",
  "minus": "remove",
  "checkmark": "check",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  "arrow.up": "arrow-upward",
  "arrow.down": "arrow-downward",
  // User
  "person.fill": "person",
  "person.2.fill": "group",
  "person.crop.circle": "account-circle",
  // Content
  "star.fill": "star",
  "heart.fill": "favorite",
  "magnifyingglass": "search",
  "bell.fill": "notifications",
  "gear": "settings",
  "trophy.fill": "emoji-events",
  "chart.bar.fill": "bar-chart",
  "clock.fill": "access-time",
  "calendar": "calendar-today",
  "flag.fill": "flag",
  "globe": "public",
  "newspaper.fill": "article",
  "video.fill": "videocam",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "backward.fill": "skip-previous",
  "forward.fill": "skip-next",
  // Chess specific
  "square.grid.2x2.fill": "grid-view",
  "brain.head.profile": "psychology",
  "bolt.fill": "bolt",
  "flame.fill": "local-fire-department",
  "target": "gps-fixed",
  "shield.fill": "shield",
  "crown.fill": "workspace-premium",
  "medal.fill": "military-tech",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
