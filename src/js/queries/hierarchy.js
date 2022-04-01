import q from '../queries';
import {useQuery,useMutation} from "react-query";

export function useWorkflowQueries(WORKFLOW_ID) {
    const getWorkflow = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery('workflow',q('workflow'),options);
    }
    const postWorkflow = () => useMutation(d=>q('workflow','POST',d)());
    const putWorkflow = () => useMutation(d=>q(`workflow/${WORKFLOW_ID}`,'PUT',d)());
    const deleteWorkflow = () => useMutation(d=>q(`workflow/${WORKFLOW_ID}`,'DELETE',{})());

    return {getWorkflow,postWorkflow,putWorkflow,deleteWorkflow};
}

//TODO: probably change to useRequestHierarchyQueries()
export function useHierarchyQueries(HIERARCHY_ID) {
    const getHierarchy = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery('hierarchy',q('hierarchy/request/'),options);
    
    }
    const postHierarchy = () => useMutation(d=>q('hierarchy','POST',d)());
    const patchHierarchy = () => useMutation(d=>q(`hierarchy/${HIERARCHY_ID}`,'PATCH',d)());
    const deleteHierarchy = () => useMutation(d=>q(`hierarchy/${HIERARCHY_ID}`,'DELETE',{})());

    return {getHierarchy,postHierarchy,patchHierarchy,deleteHierarchy};
}

