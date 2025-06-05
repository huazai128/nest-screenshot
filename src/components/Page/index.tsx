import React, { useEffect } from 'react';
import { Layout } from 'antd';
import type { FC, ReactNode } from 'react';
import type { LayoutProps } from 'antd';
import classNames from 'classnames';
import styles from './style.module.scss';

export interface PageProps extends LayoutProps {
  title?: string;
  children: ReactNode;
}

const Page: FC<PageProps> = ({
  title,
  children,
  className,
  ...props
}: PageProps) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  return (
    <Layout {...props} className={classNames(styles.pageBox, className)}>
      {children}
    </Layout>
  );
};

export default Page;
