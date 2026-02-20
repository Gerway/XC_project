import { Component } from 'react'
import Taro from '@tarojs/taro'
import { CoverView } from '@tarojs/components'
import './index.scss'

export default class Index extends Component {
    state = {
        selected: 0,
        list: [
            {
                pagePath: '/pages/home/index',
                icon: 'icon-home',
                label: '首页'
            },
            {
                pagePath: '/pages/search/index',
                icon: 'icon-search',
                label: '搜索'
            },
            {
                pagePath: '/pages/orders/index',
                icon: 'icon-order',
                label: '订单'
            },
            {
                pagePath: '/pages/profile/index',
                icon: 'icon-person',
                label: '我的'
            }
        ]
    }

    componentDidMount() {
        console.log('CustomTabBar mounted (Class Component)');
    }

    switchTab(index, url) {
        this.setSelected(index)
        Taro.switchTab({ url })
    }

    setSelected(idx: number) {
        this.setState({
            selected: idx
        })
    }

    render() {
        const { list, selected } = this.state

        return (
            <CoverView className='tab-bar'>
                <CoverView className='tab-bar-border'></CoverView>
                {list.map((item, index) => {
                    return (
                        <CoverView
                            key={item.pagePath}
                            className={`tab-bar__item ${selected === index ? 'tab-bar__item--active' : ''}`}
                            onClick={this.switchTab.bind(this, index, item.pagePath)}
                        >
                            {/* Using CoverView for IconFont because we don't have images */}
                            <CoverView className={`iconfont ${item.icon} tab-bar__icon`} />
                            <CoverView className="tab-bar__label">{item.label}</CoverView>
                        </CoverView>
                    )
                })}
            </CoverView>
        )
    }
}
