import { combineReducers } from 'redux-immutable';
import { reducer as formReducer } from 'redux-form/immutable';
import { reducer as toastrReducer } from 'react-redux-toastr';

import translateReducer from '../services/translations/reducer';

const rootReducer = combineReducers({
    form: formReducer,
    translate: translateReducer,
    toastr: toastrReducer,
});

export default rootReducer;
