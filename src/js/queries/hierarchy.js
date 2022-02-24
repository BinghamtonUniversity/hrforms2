import q from '../queries';
import {useQuery,useMutation} from "react-query";

//may need to make workflowqueries and hierarchyqueries or not default since WF is part of hierarchy

export default function useHierarchyQueries() {
    const getWorkflows = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery('workflow',q('workflow'),options);
    }
    const getHierarchy = (...args) => {
        const options = args[0]?.options||args[0]||{};
        return useQuery('hierarchy',q('hierarchy'),options);
    }

    return {getWorkflows,getHierarchy};
}