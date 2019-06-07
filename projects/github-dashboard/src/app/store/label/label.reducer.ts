import {createEntityAdapter, EntityAdapter} from '@ngrx/entity';
import {Label} from '../../github/app-types/label';
import {LabelAction, LabelActionTypes} from './label.action';
import {LabelState} from './label.state';

export const entityAdapter: EntityAdapter<Label> =
  createEntityAdapter<Label>();

const initialState: LabelState = {
  ids: entityAdapter.getInitialState().ids as string[],
  entities: entityAdapter.getInitialState().entities,
};

export function labelActionReducer(state: LabelState = initialState, action: LabelAction): LabelState {
  switch (action.type) {

    case LabelActionTypes.UPDATE_FROM_GITHUB:
      return entityAdapter.upsertMany(action.payload.labels, state);

    case LabelActionTypes.LOAD_FROM_LOCAL_DB:
      return entityAdapter.addAll(action.payload.labels, state);

    case LabelActionTypes.REMOVE_ALL:
      return entityAdapter.removeAll(state);

    default:
      return state;
  }
}

export const selectAllLabels = entityAdapter.getSelectors().selectAll;