import React from 'react';
import ReceiptSetting from './components/ReceiptSetting';
import styles from './style.module.scss';
import classNames from 'classnames';

const Screenshot = () => {
  return (
    <div className={classNames(styles.scrollbarBox, 'flex flex-col')}>
      <ReceiptSetting />
    </div>
  );
};

export default Screenshot;
