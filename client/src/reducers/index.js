// rootReducer
// 3rd party dependencies
import { combineReducers } from 'redux';
// custom reducers
import alert from './alert';
import auth from './auth';

export default combineReducers({
  alert,
  auth,
});
