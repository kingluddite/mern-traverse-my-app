// rootReducer
// 3rd party dependencies
import { combineReducers } from 'redux';
// custom reducers
import alert from './alert';
import auth from './auth';
import profile from './profile';
import post from './post';

export default combineReducers({
  alert,
  auth,
  profile,
  post,
});
