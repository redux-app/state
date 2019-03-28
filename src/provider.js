import React from 'react';
import PropTypes from 'prop-types';
import StoreContext from './context';

const StoreProvider = ({ children, store }) => {
  store.setContext && store.setContext(store);
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  )
}

StoreProvider.propTypes = {
  children: PropTypes.node.isRequired,
  store: PropTypes.object.isRequired,
};

export default StoreProvider;
