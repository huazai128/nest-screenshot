import Page, { type PageProps } from '.';
import styles from './style.scss';

const PageContent = ({ children, ...props }: PageProps) => {
  return (
    <Page {...props}>
      <div className={styles.pageContent}>{children}</div>
    </Page>
  );
};

export default PageContent;
