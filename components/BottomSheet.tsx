import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View, Animated, PanResponder, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

interface BottomSheetProps {
  children: React.ReactNode;
}

const BottomSheet = forwardRef((props: BottomSheetProps, ref) => {
  const { children } = props;
  
  const bottomSheetHeight = height * 0.35;
  const minSnapPoint = height - bottomSheetHeight;
  const maxSnapPoint = height - 100;
  
  const animatedValue = useRef(new Animated.Value(minSnapPoint)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newPosition = minSnapPoint + gestureState.dy;
        if (newPosition >= minSnapPoint && newPosition <= maxSnapPoint) {
          animatedValue.setValue(newPosition);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentPosition = minSnapPoint + gestureState.dy;
        
        if (currentPosition < minSnapPoint + (maxSnapPoint - minSnapPoint) / 2) {
          // Snap to minSnapPoint (expanded)
          Animated.spring(animatedValue, {
            toValue: minSnapPoint,
            useNativeDriver: false,
          }).start();
        } else {
          // Snap to maxSnapPoint (collapsed)
          Animated.spring(animatedValue, {
            toValue: maxSnapPoint,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;
  
  useImperativeHandle(ref, () => ({
    expand: () => {
      Animated.spring(animatedValue, {
        toValue: minSnapPoint,
        useNativeDriver: false,
      }).start();
    },
    collapse: () => {
      Animated.spring(animatedValue, {
        toValue: maxSnapPoint,
        useNativeDriver: false,
      }).start();
    },
  }));
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: animatedValue,
          height: bottomSheetHeight,
        },
      ]}
    >
      <View style={styles.dragHandler} {...panResponder.panHandlers} />
      {children}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  dragHandler: {
    width: '100%',
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomSheet;