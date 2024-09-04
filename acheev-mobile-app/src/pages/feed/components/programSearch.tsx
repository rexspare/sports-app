import React from 'react';
import { TextInput, Image, View } from "react-native";

const iconSearch = require(`../../../assets/images/icons/program_search.png`);


interface Props {
  onPress?: () => void;
  query?: string;
  setQuery?: (val: string) => void;
}


export function ProgramSearch({ onPress, query, setQuery }: Props) {

  return (
    <View style={{ borderWidth: 2, borderColor: '#AAAAAA', borderRadius: 10, paddingHorizontal: 20, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1, height: 50 }}>
      <TextInput
        style={{ height: '100%', width: '100%', color: 'white' }}
        placeholder='By sport, focus, workout'
        placeholderTextColor="#AAAAAA"
        onPressIn={() => onPress?.()}
        value={query}
        onChangeText={setQuery}
      >

      </TextInput>
      <Image source={iconSearch} style={{ height: 25, width: 25, resizeMode: 'contain', marginRight: 20, marginLeft: -20 }} />
    </View>
  );
}
