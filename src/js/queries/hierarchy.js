import q from '../queries';
import {useQuery,useMutation} from "react-query";

export function useWorkflowQueries(WORKFLOW_KEY,WORKFLOW_ID) {
    const getWorkflow = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery(['workflow',WORKFLOW_KEY],q(`workflow/${WORKFLOW_KEY}`),options);
    }
    const postWorkflow = () => useMutation(d=>q(`workflow/${WORKFLOW_KEY}`,'POST',d)());
    const putWorkflow = () => useMutation(d=>q(`workflow/${WORKFLOW_KEY}/${WORKFLOW_ID}`,'PUT',d)());
    const deleteWorkflow = () => useMutation(()=>q(`workflow/${WORKFLOW_KEY}/${WORKFLOW_ID}`,'DELETE',{})());

    return {getWorkflow,postWorkflow,putWorkflow,deleteWorkflow};
}

export function useHierarchyQueries(HIERARCHY_KEY,HIERARCHY_ID) {
    const getHierarchy = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery(['hierarchy',HIERARCHY_KEY],q(`hierarchy/${HIERARCHY_KEY}`),options);    
    }
    const getHierarchyPaged = (...args) => {
        const params = args[0]?.params||args[0]||{};
        const options = args[0]?.options||args[1]||{};
        const urlParams = new URLSearchParams(params).toString();
        return useQuery(['hierarchy',HIERARCHY_KEY,...Object.values(params)],q(`hierarchypaged/${HIERARCHY_KEY}?${urlParams}`),options);
    
    }
    const postHierarchy = () => useMutation(d=>q(`hierarchy/${HIERARCHY_KEY}`,'POST',d)());
    const patchHierarchy = () => useMutation(d=>q(`hierarchy/${HIERARCHY_KEY}/${HIERARCHY_ID}`,'PATCH',d)());
    const deleteHierarchy = () => useMutation(()=>q(`hierarchy/${HIERARCHY_KEY}/${HIERARCHY_ID}`,'DELETE',{})());

    return {getHierarchy,getHierarchyPaged,postHierarchy,patchHierarchy,deleteHierarchy};
}

