import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './CityPicker.scss';

interface CityPickerProps {
    isOpen: boolean;
    currentCity: string;
    onClose: () => void;
    onSelect: (city: string) => void;
}

// 热门城市
const HOT_CITIES = [
    '成都', '北京', '广州', '三亚',
    '上海', '重庆', '杭州', '深圳',
    '武汉', '长沙', '海口', '昆明',
    '澳门', '贵阳', '西安', '大理',
    '郑州', '乌鲁木齐', '佛山', '宁波',
    '南宁', '南京', '厦门', '合肥',
];

// 完整中国城市按字母分组
const CITY_DATA: Record<string, string[]> = {
    A: ['阿坝', '阿克苏', '阿拉善', '阿里', '安康', '安庆', '鞍山', '安顺', '安阳'],
    B: ['百色', '白城', '白山', '白银', '保定', '宝鸡', '保山', '包头', '巴彦淖尔', '巴中', '巴音郭楞', '保亭', '北海', '北京', '蚌埠', '本溪', '毕节', '滨州', '博尔塔拉'],
    C: ['沧州', '长春', '常德', '昌都', '昌吉', '长沙', '长治', '常州', '朝阳', '潮州', '承德', '成都', '郴州', '赤峰', '池州', '重庆', '崇左', '楚雄', '滁州'],
    D: ['大理', '大连', '丹东', '大庆', '大兴安岭', '大同', '达州', '德宏', '德阳', '德州', '定西', '迪庆', '东莞', '东营'],
    E: ['鄂尔多斯', '恩施', '鄂州'],
    F: ['防城港', '佛山', '抚顺', '阜新', '阜阳', '福州'],
    G: ['甘南', '甘孜', '赣州', '广安', '广元', '广州', '贵港', '桂林', '贵阳', '果洛'],
    H: ['哈尔滨', '海北', '海东', '海南', '海西', '哈密', '邯郸', '杭州', '汉中', '鹤壁', '河池', '合肥', '鹤岗', '黑河', '衡水', '衡阳', '河源', '菏泽', '贺州', '红河', '淮安', '淮北', '怀化', '淮南', '黄冈', '黄南', '黄山', '黄石', '呼和浩特', '呼伦贝尔', '葫芦岛', '湖州', '惠州'],
    J: ['佳木斯', '吉安', '嘉兴', '嘉峪关', '揭阳', '吉林', '济南', '金昌', '晋城', '景德镇', '荆门', '荆州', '金华', '济宁', '晋中', '锦州', '九江', '酒泉', '鸡西'],
    K: ['开封', '喀什', '克拉玛依', '克孜勒苏', '昆明'],
    L: ['兰州', '廊坊', '拉萨', '乐山', '凉山', '连云港', '聊城', '辽阳', '辽源', '丽江', '临沧', '临汾', '临夏', '临沂', '林芝', '丽水', '六安', '六盘水', '柳州', '陇南', '龙岩', '娄底', '泸州', '洛阳', '漯河'],
    M: ['马鞍山', '茂名', '眉山', '梅州', '绵阳', '牡丹江'],
    N: ['南昌', '南充', '南京', '南宁', '南通', '南阳', '那曲', '内江', '宁波', '宁德', '怒江'],
    P: ['盘锦', '攀枝花', '平顶山', '平凉', '萍乡', '普洱', '莆田', '濮阳'],
    Q: ['黔东南', '黔南', '黔西南', '青岛', '庆阳', '清远', '秦皇岛', '钦州', '琼海', '齐齐哈尔', '七台河', '泉州', '曲靖', '衢州'],
    R: ['日喀则', '日照'],
    S: ['三门峡', '三明', '三亚', '厦门', '商洛', '商丘', '上饶', '山南', '汕头', '汕尾', '韶关', '绍兴', '邵阳', '沈阳', '深圳', '石河子', '十堰', '石家庄', '双鸭山', '朔州', '四平', '松原', '随州', '遂宁', '宿迁', '苏州', '宿州'],
    T: ['塔城', '泰安', '太原', '台州', '泰州', '唐山', '天津', '天水', '铁岭', '铜川', '通化', '通辽', '铜陵', '铜仁', '吐鲁番'],
    W: ['潍坊', '威海', '渭南', '文山', '温州', '乌海', '武汉', '芜湖', '乌兰察布', '乌鲁木齐', '无锡', '吴忠', '梧州'],
    X: ['西安', '襄阳', '湘潭', '湘西', '咸宁', '咸阳', '孝感', '邢台', '西宁', '新乡', '信阳', '新余', '忻州', '西双版纳', '宣城', '许昌', '徐州'],
    Y: ['雅安', '延安', '延边', '盐城', '阳江', '阳泉', '扬州', '烟台', '宜宾', '宜昌', '伊春', '伊犁', '银川', '鹰潭', '营口', '永州', '岳阳', '榆林', '玉林', '运城', '云浮', '玉树', '玉溪'],
    Z: ['枣庄', '张家界', '张家口', '张掖', '漳州', '湛江', '肇庆', '昭通', '郑州', '中山', '中卫', '周口', '舟山', '珠海', '驻马店', '株洲', '淄博', '自贡', '资阳', '遵义'],
};

// 构建一个所有城市的扁平数组，用于根据坐标匹配最近城市
const ALL_CITIES: string[] = [];
for (const letter of Object.keys(CITY_DATA)) {
    ALL_CITIES.push(...CITY_DATA[letter]);
}

const LETTERS = Object.keys(CITY_DATA);

// 主要城市坐标表（用于反向地理编码匹配最近城市）
const CITY_COORDS: Record<string, [number, number]> = {
    '北京': [39.90, 116.40], '上海': [31.23, 121.47], '广州': [23.13, 113.26],
    '深圳': [22.54, 114.06], '重庆': [29.56, 106.55], '成都': [30.57, 104.07],
    '杭州': [30.27, 120.15], '武汉': [30.59, 114.30], '西安': [34.26, 108.94],
    '南京': [32.06, 118.80], '天津': [39.08, 117.20], '苏州': [31.30, 120.62],
    '长沙': [28.23, 112.94], '沈阳': [41.80, 123.43], '青岛': [36.07, 120.38],
    '郑州': [34.75, 113.65], '大连': [38.91, 121.61], '东莞': [23.05, 113.74],
    '宁波': [29.87, 121.55], '厦门': [24.48, 118.09], '昆明': [25.04, 102.71],
    '合肥': [31.82, 117.23], '佛山': [23.02, 113.12], '福州': [26.07, 119.30],
    '哈尔滨': [45.75, 126.65], '济南': [36.65, 116.98], '温州': [28.00, 120.67],
    '南宁': [22.82, 108.37], '长春': [43.88, 125.32], '泉州': [24.87, 118.68],
    '石家庄': [38.04, 114.51], '贵阳': [26.65, 106.63], '南昌': [28.68, 115.86],
    '太原': [37.87, 112.55], '兰州': [36.06, 103.83], '海口': [20.02, 110.35],
    '三亚': [18.25, 109.50], '珠海': [22.27, 113.58], '乌鲁木齐': [43.83, 87.62],
    '呼和浩特': [40.84, 111.75], '拉萨': [29.65, 91.14], '银川': [38.49, 106.23],
    '西宁': [36.62, 101.78], '烟台': [37.54, 121.39], '洛阳': [34.62, 112.45],
    '徐州': [34.26, 117.19], '唐山': [39.63, 118.18], '保定': [38.87, 115.46],
    '惠州': [23.11, 114.42], '中山': [22.52, 113.39], '潍坊': [36.71, 119.10],
    '襄阳': [32.01, 112.14], '常州': [31.81, 119.97], '嘉兴': [30.77, 120.76],
    '绍兴': [30.00, 120.58], '大理': [25.59, 100.23], '丽江': [26.86, 100.23],
    '桂林': [25.27, 110.29], '柳州': [24.33, 109.41],
};

/**
 * 根据经纬度匹配最近的城市
 */
function matchCityByCoords(lat: number, lng: number): string {
    let minDist = Infinity;
    let matched = '';
    for (const [city, [cLat, cLng]] of Object.entries(CITY_COORDS)) {
        const dist = Math.sqrt(Math.pow(lat - cLat, 2) + Math.pow(lng - cLng, 2));
        if (dist < minDist) {
            minDist = dist;
            matched = city;
        }
    }
    return matched || '';
}

const CityPicker: React.FC<CityPickerProps> = ({ isOpen, currentCity, onClose, onSelect }) => {
    const [searchText, setSearchText] = useState('');
    const [currentLocation, setCurrentLocation] = useState('');
    const [currentAddress, setCurrentAddress] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [scrollIntoId, setScrollIntoId] = useState('');

    useEffect(() => {
        if (isOpen) {
            // 读取历史记录
            try {
                const saved = Taro.getStorageSync('cityHistory');
                if (saved) setHistory(JSON.parse(saved));
            } catch { }

            // 获取当前位置并通过坐标匹配城市
            setCurrentLocation('定位中...');
            setCurrentAddress('');
            Taro.getLocation({
                type: 'gcj02',
                success: (res) => {
                    const city = matchCityByCoords(res.latitude, res.longitude);
                    setCurrentLocation(city || currentCity || '未知');
                    setCurrentAddress(`${res.latitude.toFixed(4)}, ${res.longitude.toFixed(4)} 附近`);
                },
                fail: () => {
                    setCurrentLocation(currentCity || '');
                    setCurrentAddress('定位失败，请手动选择');
                }
            });
        }
    }, [isOpen, currentCity]);

    if (!isOpen) return null;

    const handleSelect = (city: string) => {
        // 保存到历史记录
        const newHistory = [city, ...history.filter(c => c !== city)].slice(0, 10);
        setHistory(newHistory);
        try {
            Taro.setStorageSync('cityHistory', JSON.stringify(newHistory));
        } catch { }
        onSelect(city);
    };

    const handleLetterClick = (letter: string) => {
        setScrollIntoId(`letter-${letter}`);
    };

    // 搜索过滤
    const filteredCities: Record<string, string[]> = {};
    if (searchText.trim()) {
        const kw = searchText.trim();
        for (const letter of LETTERS) {
            const matched = CITY_DATA[letter].filter(c => c.includes(kw));
            if (matched.length > 0) filteredCities[letter] = matched;
        }
    }

    const displayData = searchText.trim() ? filteredCities : CITY_DATA;
    const displayLetters = Object.keys(displayData);

    return (
        <View className="city-picker">
            <View className="city-picker__backdrop" onClick={onClose}></View>
            <View className="city-picker__content">
                {/* Header */}
                <View className="city-picker__header">
                    <View className="city-picker__close" onClick={onClose}>
                        <Text>‹</Text>
                    </View>
                    <Text className="city-picker__title">选择所在地区</Text>
                    <View style={{ width: '32px' }}></View>
                </View>

                {/* Search Bar */}
                <View className="city-picker__search">
                    <Text className="city-picker__search-icon">⌕</Text>
                    <Input
                        className="city-picker__search-input"
                        placeholder="搜索城市/区域/景点"
                        value={searchText}
                        onInput={e => setSearchText(e.detail.value)}
                    />
                </View>

                {/* Scrollable Content */}
                <ScrollView
                    scrollY
                    scrollIntoView={scrollIntoId}
                    scrollWithAnimation
                    className="city-picker__body"
                >
                    {/* 当前位置 */}
                    {!searchText.trim() && (
                        <View id="section-location" className="city-picker__section">
                            <Text className="city-picker__section-title">当前位置</Text>
                            <View className="city-picker__location-info">
                                <Text className="city-picker__location-dot">⊙</Text>
                                <Text className="city-picker__location-addr">{currentLocation}{currentAddress ? `，${currentAddress}` : ''}</Text>
                            </View>
                            <View className="city-picker__tag-grid">
                                <View
                                    className={`city-picker__tag ${currentLocation === currentCity ? 'city-picker__tag--active' : ''}`}
                                    onClick={() => currentLocation && currentLocation !== '定位中...' && handleSelect(currentLocation)}
                                >
                                    <Text>{currentLocation || '定位中...'}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* 历史选择 */}
                    {!searchText.trim() && history.length > 0 && (
                        <View id="section-history" className="city-picker__section">
                            <Text className="city-picker__section-title">历史选择</Text>
                            <View className="city-picker__tag-grid">
                                {history.map((city, i) => (
                                    <View
                                        key={i}
                                        className={`city-picker__tag ${city === currentCity ? 'city-picker__tag--active' : ''}`}
                                        onClick={() => handleSelect(city)}
                                    >
                                        <Text>{city}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* 热门城市 */}
                    {!searchText.trim() && (
                        <View id="section-hot" className="city-picker__section">
                            <View className="city-picker__section-title-row">
                                <Text className="city-picker__hot-icon">●</Text>
                                <Text className="city-picker__section-title">热门城市</Text>
                            </View>
                            <View className="city-picker__hot-grid">
                                {HOT_CITIES.map((city, i) => (
                                    <View
                                        key={i}
                                        className={`city-picker__hot-item ${city === currentCity ? 'city-picker__hot-item--active' : ''}`}
                                        onClick={() => handleSelect(city)}
                                    >
                                        <Text>{city}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* 字母索引城市列表 */}
                    <View className="city-picker__section">
                        <Text className="city-picker__section-title">字母索引</Text>
                        {displayLetters.map(letter => (
                            <View key={letter} id={`letter-${letter}`} className="city-picker__letter-group">
                                <Text className="city-picker__letter-header">{letter}</Text>
                                <View className="city-picker__letter-cities">
                                    {displayData[letter].map((city, i) => (
                                        <View
                                            key={i}
                                            className="city-picker__city-row"
                                            onClick={() => handleSelect(city)}
                                        >
                                            <Text className={`city-picker__city-name ${city === currentCity ? 'city-picker__city-name--active' : ''}`}>{city}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={{ height: '60px' }}></View>
                </ScrollView>

                {/* Right-side Letter Index */}
                <View className="city-picker__letter-index">
                    <View className="city-picker__letter-index-item" onClick={() => setScrollIntoId('section-location')}>
                        <Text className="city-picker__letter-index-text city-picker__letter-index-text--special">定位</Text>
                    </View>
                    <View className="city-picker__letter-index-item" onClick={() => setScrollIntoId('section-history')}>
                        <Text className="city-picker__letter-index-text city-picker__letter-index-text--special">历史</Text>
                    </View>
                    <View className="city-picker__letter-index-item" onClick={() => setScrollIntoId('section-hot')}>
                        <Text className="city-picker__letter-index-text city-picker__letter-index-text--special">热门</Text>
                    </View>
                    {LETTERS.map(letter => (
                        <View
                            key={letter}
                            className="city-picker__letter-index-item"
                            onClick={() => handleLetterClick(letter)}
                        >
                            <Text className="city-picker__letter-index-text">{letter}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

export default CityPicker;
