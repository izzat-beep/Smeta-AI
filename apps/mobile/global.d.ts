// NativeWind className tip augmentatsiyasi — ishonchli, o'zimiz boshqaramiz.
// (Transitive react-native-css-interop/types nested o'rnatilgani sabab avtomatik
// yuklanmaydi; bu yerda foydalanadigan komponentlarni to'g'ridan-to'g'ri
// augmentatsiya qilamiz. Bir xil a'zolar merge bo'lsa TS ruxsat beradi.)
import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ScrollViewProps {
    // className ViewProps'dan meros; bu yerda faqat konteyner klassi.
    contentContainerClassName?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
}
