import { NavigationProp, useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, TouchableOpacity, TouchableOpacityProps, View } from "react-native";
import { AppText } from '../../../shared/components/AppText';
import { Colors } from '../../../shared/Constants';
import { AppRoutes, NavigatorParams } from '../../../shared/Routing';
import { Program } from '../../../types/gqlReactTypings.generated.d';


interface Props extends TouchableOpacityProps {
  program: Pick<Program, 'id' | 'imageUrl' | 'name'>;
  size?: number;
  onPress?: () => void;
  /** Defaults to program name */
  title?: string;
  subtitle?: string;
  EnableOnPress?: boolean;
}

export function ProgramCard(props: Props) {
  const { program, size = 120, onPress, title, subtitle, EnableOnPress = true } = props;
  const navigation = useNavigation<NavigationProp<NavigatorParams>>();

  return (
    <TouchableOpacity
      onPress={() => EnableOnPress && (onPress ?? navigation.navigate(AppRoutes.PROGRAM_LISTING, { programId: program.id }))}
      style={{ marginRight: 20, alignItems: 'center' }} key={program.id}
      {...props}>
      <View style={{ padding: Math.round(size / 12), borderWidth: Math.round(size / 30), borderColor: Colors.YELLOW, flexGrow: 0, flexShrink: 1, borderRadius: 150, }}>
        <Image source={{ uri: program.imageUrl }} style={{ width: size, height: size, borderRadius: size, borderWidth: 1, borderColor: Colors.YELLOW + '7f', }} />
      </View>
      <AppText style={{ fontSize: Math.round(size / 6), color: 'white', marginTop: 10 }}>{title ?? program.name}</AppText>
      {subtitle != null &&
        <AppText style={{ fontSize: Math.round(size / 8), color: 'white', marginTop: 5 }}>{subtitle}</AppText>

      }
    </TouchableOpacity>
  );
}
