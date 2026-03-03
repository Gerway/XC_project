import React, { useState, useCallback, useRef, useMemo } from 'react';
import { ScrollView, View } from '@tarojs/components';
import './VirtualScrollList.scss';

interface VirtualScrollListProps {
    /** 滚动容器高度 (px) */
    height: number;
    /** 列表项总数 */
    itemCount: number;
    /** 每项估算高度 (px) */
    itemHeight: number;
    /** 上下各多渲染的缓冲条数 */
    overscanCount?: number;
    /** 渲染第 index 条的回调 */
    renderItem: (index: number) => React.ReactNode;
    /** 列表底部额外内容（骨架屏 / "到底了"） */
    footer?: React.ReactNode;
    /** 滚动到底部时的回调 */
    onScrollToLower?: () => void;
    /** 距底部多少 px 时触发 onScrollToLower */
    lowerThreshold?: number;
}

const VirtualScrollList: React.FC<VirtualScrollListProps> = ({
    height,
    itemCount,
    itemHeight,
    overscanCount = 3,
    renderItem,
    footer,
    onScrollToLower,
    lowerThreshold = 300,
}) => {
    const [scrollTop, setScrollTop] = useState(0);
    const loadingTriggeredRef = useRef(false);

    // 总高度 = 所有项撑起的空间
    const totalHeight = itemCount * itemHeight;

    // 计算可见窗口内需要渲染的起止索引
    const { startIndex, endIndex } = useMemo(() => {
        const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount);
        const visibleCount = Math.ceil(height / itemHeight);
        const end = Math.min(itemCount, Math.floor(scrollTop / itemHeight) + visibleCount + overscanCount);
        return { startIndex: start, endIndex: end };
    }, [scrollTop, itemHeight, height, itemCount, overscanCount]);

    // 可见区域的上方留白 (用 paddingTop 定位)
    const offsetTop = startIndex * itemHeight;

    const handleScroll = useCallback((e: any) => {
        const currentScrollTop = e.detail?.scrollTop ?? 0;
        setScrollTop(currentScrollTop);

        // 触底检测
        if (onScrollToLower) {
            const scrollBottom = currentScrollTop + height;
            if (scrollBottom >= totalHeight - lowerThreshold) {
                if (!loadingTriggeredRef.current) {
                    loadingTriggeredRef.current = true;
                    onScrollToLower();
                }
            } else {
                // 用户往上滑了，重置触发标记
                loadingTriggeredRef.current = false;
            }
        }
    }, [height, totalHeight, lowerThreshold, onScrollToLower]);

    // 生成可见范围内的元素
    const visibleItems: React.ReactNode[] = [];
    for (let i = startIndex; i < endIndex; i++) {
        visibleItems.push(
            <View key={i} className="virtual-scroll-list__item">
                {renderItem(i)}
            </View>
        );
    }

    return (
        <ScrollView
            scrollY
            className="virtual-scroll-list"
            style={{ height: `${height}px` }}
            onScroll={handleScroll}
            scrollWithAnimation={false}
            enhanced
            showScrollbar={false}
        >
            {/* 顶部占位：将可见项推到正确的滚动位置 */}
            <View style={{ height: `${offsetTop}px` }} />

            {/* 只渲染可见窗口内的卡片 */}
            {visibleItems}

            {/* 底部占位：撑起剩余高度，保证滚动条位置正确 */}
            <View style={{ height: `${Math.max(0, totalHeight - offsetTop - (endIndex - startIndex) * itemHeight)}px` }} />

            {/* 底部区域（骨架屏 / 到底了） */}
            {footer}
        </ScrollView>
    );
};

export default React.memo(VirtualScrollList);
