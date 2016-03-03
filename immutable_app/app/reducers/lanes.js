import {List} from 'immutable';
import update from 'react-addons-update';
import * as types from '../actions/lanes';

const initialState = List();

export default function lanes(state = initialState, action) {
  switch (action.type) {
    case types.CREATE_LANE:
      return state.push(action.lane);

    case types.UPDATE_LANE:
      // XXX: this can crash if findIndex fails
      return state.update(
        state.findIndex(lane => lane.id === action.id),
        lane => action
      );

    case types.DELETE_LANE:
      // XXX: this can crash if findIndex fails
      return state.delete(state.findIndex(o => o.id === action.id));

    case types.ATTACH_TO_LANE:
      const laneId = action.laneId;
      const noteId = action.noteId;

      // XXX: this can crash if findIndex fails
      return state.update(
        state.findIndex(lane => lane.id === laneId),
        lane => Object.assign({}, lane, {
          notes: [...lane.notes, noteId]
        })
      );

    case types.DETACH_FROM_LANE:
      return state.map((lane) => {
        if(lane.id === action.laneId) {
          return Object.assign({}, lane, {
            notes: lane.notes.filter((id) => id !== action.noteId)
          });
        }

        return lane;
      });

    case types.MOVE:
      const sourceId = action.sourceId;
      const targetId = action.targetId;

      const lanes = state;
      const sourceLane = lanes.filter((lane) => {
        return lane.notes.indexOf(sourceId) >= 0;
      })[0];
      const targetLane = lanes.filter((lane) => {
        return lane.notes.indexOf(targetId) >= 0;
      })[0];
      const sourceNoteIndex = sourceLane.notes.indexOf(sourceId);
      const targetNoteIndex = targetLane.notes.indexOf(targetId);

      if(sourceLane === targetLane) {
        return state.map((lane) => {
          return lane.id === sourceLane.id ? Object.assign({}, lane, {
            notes: update(sourceLane.notes, {
              $splice: [
                [sourceNoteIndex, 1],
                [targetNoteIndex, 0, sourceId]
              ]
            })
          }) : lane;
        });
      }
      else {
        return state.map((lane) => {
          if(lane === sourceLane) {
            // get rid of the source note
            return Object.assign({}, lane, {
              notes: lane.notes.length > 1 ? lane.notes.slice(0, sourceNoteIndex).concat(
                lane.notes.slice(sourceNoteIndex + 1)
              ): []
            });
          }

          if(lane === targetLane) {
            // and move it to target
            return Object.assign({}, lane, {
              notes: lane.notes.slice(0, targetNoteIndex).concat(
                [sourceId]
              ).concat(
                lane.notes.slice(targetNoteIndex)
              )
            });
          }

          return lane;
        });
      }

      return state;

    default:
      return state;
  }
}
