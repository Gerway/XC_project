import React from 'react';
import { View, Image, Text } from '@tarojs/components';
import loadingGif from '../../images/loading.gif';
import './LoadingScreen.scss';

interface Props {
    text?: string;
}

const LoadingScreen: React.FC<Props> = ({ text = '加载中...' }) => {
    return (
        <View className="loading-screen">
            <Image className="loading-screen__gif" src={loadingGif} mode="aspectFit" />
            <Text className="loading-screen__text">{text}</Text>
        </View>
    );
};

export default LoadingScreen;
