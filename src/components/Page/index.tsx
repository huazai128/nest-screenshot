import React, { FC, useEffect } from 'react'
import { Layout, LayoutProps } from 'antd'
import classNames from 'classnames'
import styles from './style.scss'

export interface PageProps extends LayoutProps {
  title: string
  children: React.ReactNode
}

const Page: FC<PageProps> = ({ title, children, className, ...props }: PageProps) => {
  useEffect(() => {
    document.title = title || '前端监控系统'
  }, [title])

  return (
    <Layout {...props} className={classNames(styles.pageBox, className)}>
      {children}
    </Layout>
  )
}

export default Page
