import React, { useState, useCallback, useMemo, useEffect, useRef, useReducer } from "react";
import { useQueryClient } from "react-query";
import useUserQueries from "../../queries/users";
import useGroupQueries from "../../queries/groups";
import useSessionQueries from "../../queries/session";
import { Loading, ModalConfirm, AppButton, errorToast, DescriptionPopover } from "../../blocks/components";
import { Row, Col, Form, Modal, Tabs, Tab, Container, Alert, InputGroup, Button } from "react-bootstrap";
import { Icon } from "@iconify/react";
import { orderBy, sortBy, difference, capitalize, startsWith } from "lodash";
import DataTable from 'react-data-table-component';
import { useForm, Controller, useWatch, FormProvider, useFormContext, useFieldArray } from "react-hook-form";
import DatePicker from "react-datepicker";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format } from "date-fns";
import { toast } from "react-toastify";
import { useHotkeys } from "react-hotkeys-hook";
import { useParams, useHistory, Link } from "react-router-dom";
import { pick } from "lodash";
import { NotFound, useAuthContext } from "../../app";
import { t } from "../../config/text";
import { flattenObject } from "../../utility";
import { Helmet } from "react-helmet";
import { CSVLink } from "react-csv";

const defaultVals = {
    SUNYID:'',
    firstName:'',
    lastName:'',
    email:'',
    notifications:"Y",
    dept:'',
    startDate:new Date(),
    endDate:'',
    assignedGroups:[],
    availableGroups:[]
};

export default function AdminUsers() {
    const [newUser,setNewUser] = useState(false);
    const {getUsers} = useUserQueries();
    const users = getUsers();

    useHotkeys('ctrl+alt+n',()=>setNewUser(true),{enableOnTags:['INPUT']});

    return (
        <>
            <Row>
                <Helmet>
                    <title>{t('admin.users.title')}</title>
                </Helmet>
                <Col><h2>{t('admin.users.title')} <AppButton format="add-user" onClick={()=>setNewUser(true)}>Add New</AppButton></h2></Col>
            </Row>
            <Row>
                <Col>
                    {users.isLoading && <Loading type="alert">Loading Users...</Loading>}
                    {users.isError && <Loading type="alert" isError>Error Users: <small>{users.error?.name} {users.error?.message}</small></Loading>}
                    {users.isSuccess && <UsersTable users={users.data} newUser={newUser} setNewUser={setNewUser}/>}
                </Col>
            </Row>
        </>
    );
}

function UsersTable({users,newUser,setNewUser}) {
    const { subpage } = useParams();
    const { SUNY_ID } = useAuthContext();
    const history = useHistory();
    const [filterText,setFilterText] = useState((!!subpage)?`id:${subpage}`:'');
    const [statusFilter,setStatusFilter] = useState('all');
    const [sortField,setsortField] = useState('sortName');
    const [sortDir,setSortDir] = useState('asc');
    const [resetPaginationToggle,setResetPaginationToggle] = useState(false);
    const [rows,setRows] = useState([]);
    const [selectedRow,setSelectedRow] = useState({});
    const [impersonateUser,setImpersonateUser] = useState({});
    const [toggleUser,setToggleUser] = useState({});
    const [deleteUser,setDeleteUser] = useState({});

    const searchRef = useRef();
    useHotkeys('ctrl+f,ctrl+alt+f',e=>{
        e.preventDefault();
        searchRef.current.focus();
    });
    useHotkeys('ctrl+alt+i',() => {
        // Impersonate the first user in the table
        setImpersonateUser(filteredRows[0]);
    },{enableOnTags:['INPUT']},[filteredRows]);

    const handleRowClick = useCallback(row=>setSelectedRow(row));
    
    const handleSort = useCallback((...args) => {
        if (!args[0].sortable) return false;
        const sortKey = columns[(args[0].id-1)].sortField;
        setsortField(sortKey);
        setSortDir(args[1]);
        setRows(orderBy(users,[sortKey],[args[1]]));
    },[]);

    const filterComponent = useMemo(() => {
        const statusChange = e => {
            setStatusFilter(e.target.value);
        }
        const handleKeyDown = e => {
            if(e.key=="Escape"&&!filterText) searchRef.current.blur();
        }
        const handleFilterChange = e => {
            if (e.target.value) {
                setResetPaginationToggle(false);
                setFilterText(e.target.value);
                if (startsWith(e.target.value,'id:')) history.push('/admin/users/'+e.target.value.split(':')[1]);
            } else {
                setResetPaginationToggle(true);
                setFilterText('');
                history.push('/admin/users');
            }
        }
        return(
            <>
                <Col sm={6} md={5} lg={4} xl={3} className="pr-0">
                    <Form style={{flexDirection:'column'}} onSubmit={e=>e.preventDefault()}>
                        <Form.Group as={Row} controlId="filter">
                            <Form.Label column sm="2">Search: </Form.Label>
                            <Col sm="10">
                                <Form.Control ref={searchRef} className="ml-2" type="search" value={filterText} placeholder="search..." onChange={handleFilterChange} onKeyDown={handleKeyDown}/>
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} controlId="status">
                            <Form.Label column sm="2" className="pt-0">Status:</Form.Label>
                            <Col sm="10">
                                <Form.Check className="ml-2" inline label="All" name="status" type="radio" id="status_all" value="all" checked={statusFilter=='all'} onChange={statusChange} />
                                <Form.Check inline label="Active" name="status" type="radio" id="status_active" value="active" checked={statusFilter=='active'} onChange={statusChange} />
                                <Form.Check inline label="Inactive" name="status" type="radio" id="status_inactive" value="inactive" checked={statusFilter=='inactive'} onChange={statusChange} />
                            </Col>
                        </Form.Group>
                    </Form>
                </Col>
            </>
        );
    },[filterText,statusFilter,useHotkeys]);

    const filteredRows = useMemo(() => {
        return rows.filter(row => {
            if (row.active && statusFilter == 'inactive') return false;
            if (!row.active && statusFilter == 'active') return false;

            if (startsWith(filterText,'id:')) {
                return row.SUNY_ID == filterText.split(':')[1];
            }
            return Object.values(pick(row,['B_NUMBER','SUNY_ID','email','endDate','endDateFmt','fullName','sortName','GROUP_NAME','startDate','startDateFmt'])).filter(r=>!!r).map(r=>r.toString().toLowerCase()).join(' ').includes(filterText.toLowerCase());
        });
    },[statusFilter,filterText,rows]);

    const columns = useMemo(() => [
        {name:'Actions',cell:row=>{
            return (
                <div className="button-group">
                    {row.SUNY_ID && <AppButton format="impersonate" size="sm" title="Impersonate User" onClick={()=>setImpersonateUser(row)} disabled={!row.active||row.SUNY_ID==SUNY_ID}/>}
                    {row.active && <AppButton format="deactivate-user" size="sm" title="Deactivate User" onClick={()=>setToggleUser(row)} disabled={row.SUNY_ID==SUNY_ID}/>}
                    {!row.active && <AppButton format="activate-user" size="sm" title="Restore User" onClick={()=>setToggleUser(row)} disabled={row.SUNY_ID==SUNY_ID}/>}
                    <AppButton format="delete" size="sm" title="Delete User" onClick={()=>setDeleteUser(row)} disabled={row.SUNY_ID==SUNY_ID}/>
                </div>
            );
        },ignoreRowClick:true},
        {name:'SUNY ID',selector:row=>{
            if (row.active) return row.USER_SUNY_ID;
            return <><del>{row.USER_SUNY_ID}</del> <em>(inactive)</em></>;
        },sortable:true,sortField:'USER_SUNY_ID'},
        {name:'Name',selector:row=>(
            <div><DescriptionPopover
                id={`${row.SUNY_ID}_details`}
                title="User Details"
                width={25}
                content={
                    <dl>
                        <dt className="mb-1 float-left">SUNY ID:</dt>
                        <dd className="mb-1">{row.SUNY_ID}</dd>
                        <dt className="mb-1 float-left">B#:</dt>
                        <dd className="mb-1">{row.B_NUMBER}</dd>
                        <dt className="mb-1 float-left">Name:</dt>
                        <dd className="mb-1">{row.fullName}</dd>
                        <dt className="mb-1 float-left">Email:</dt>
                        <dd className="mb-1">{row.email}</dd>
                    </dl>
                }
            >
                <Icon className="iconify-inline" icon="mdi:clipboard-account" width={24} height={24}/>
            </DescriptionPopover> {row.sortName}</div>
        ),sortable:true,sortField:'sortName'},
        {name:'Email',selector:row=>row.email,sortable:true,sortField:'email'},
        {name:'Dept Group',selector:row=>row.GROUP_NAME,sortable:true},
        {name:'Start Date',selector:row=>row.startDateUnix,format:row=>row.startDateFmt,sortable:true,sortField:'startDateUnix'},
        {name:'End Date',selector:row=>row.endDateUnix,format:row=>row.endDateFmt,sortable:true,sortField:'endDateUnix'}
    ],[users,SUNY_ID]);

    const actionsMemo = useMemo(() => {
        let data = filteredRows || [];
        if (!data.length) return <Button disabled>No Data Available</Button>;
        return <CSVLink data={data} filename="HRForms2_Users.csv" className="btn btn-primary" target="_blank">Dowload CSV</CSVLink>
    },[filteredRows,statusFilter,filterText,rows]);

    const conditionalRowStyles = [
        {
            when: row => !row.active,
            style: {
                color: '#999'
            }
        }
    ];

    const paginationComponentOptions = {
        selectAllRowsItem: true
    };

    useEffect(()=>setRows(orderBy(users,[sortField],[sortDir])),[users]);
    useEffect(()=>searchRef.current.focus(),[]);
    return (
        <>
            <DataTable 
                keyField="USER_SUNY_ID"
                columns={columns} 
                data={filteredRows}
                actions={actionsMemo}
                pagination 
                striped 
                responsive
                subHeader
                subHeaderComponent={filterComponent} 
                paginationRowsPerPageOptions={[10,20,30,40,50,100]}
                paginationResetDefaultPage={resetPaginationToggle}
                paginationComponentOptions={paginationComponentOptions}
                pointerOnHover
                highlightOnHover
                onRowClicked={handleRowClick}
                defaultSortFieldId={2}
                onSort={handleSort}
                sortServer
                conditionalRowStyles={conditionalRowStyles}
                noDataComponent={<p className="m-3">No Users Found Matching Your Criteria</p>}
            />
            {(selectedRow?.SUNY_ID||newUser) && 
                (<>
                    <Helmet><title>{t('admin.users.title')} - {(newUser)?'New User':`Edit User: ${selectedRow.fullName}`}</title></Helmet>
                    <AddEditUserForm {...selectedRow} setSelectedRow={setSelectedRow} newUser={newUser} setNewUser={setNewUser}/>
                </>)
            }
            {impersonateUser?.SUNY_ID && <ImpersonateUser user={impersonateUser} setImpersonateUser={setImpersonateUser}/>}
            {toggleUser?.SUNY_ID && <ToggleUser user={toggleUser} setToggleUser={setToggleUser}/>}
            {deleteUser?.SUNY_ID && <DeleteUser user={deleteUser} setDeleteUser={setDeleteUser}/>}
        </>
    );
}

function ImpersonateUser({user,setImpersonateUser}) {
    const [show,setShow] = useState(true);

    const history = useHistory();
    const queryclient = useQueryClient();
    const { patchSession } = useSessionQueries();
    const mutation = patchSession();

    const buttons = {
        close: {
            title: 'Cancel',
            callback: () => {
                setShow(false);
                setImpersonateUser({});
            }
        },
        confirm:{
            title: 'Impersonate',
            format: 'impersonate',
            callback: () => {
                mutation.mutateAsync({IMPERSONATE_SUNY_ID:user.SUNY_ID}).then(d => {
                    queryclient.refetchQueries('session').then(()=>{
                        setShow(false);
                        history.push('/');
                    });
                });
            }
        }
    }
    return (
        <ModalConfirm show={show} icon="mdi:account-question" title="Impersonate User?" buttons={buttons}>
            <p>Are you sure you want to impersonate {user.fullName} ({user.SUNY_ID})?</p>
        </ModalConfirm>
    );
}

function ToggleUser({user,setToggleUser}) {
    const {patchUser} = useUserQueries(user.SUNY_ID);
    const queryclient = useQueryClient();
    const update = patchUser();
    useEffect(() => {
        const newEndDate = (user.END_DATE)?'':format(new Date(),'dd-MMM-yy');
        const words = (user.END_DATE)?['activate','activating','activated']:['deactivate','deactivating','deactivated'];
        toast.promise(new Promise((resolve,reject) => {
            update.mutateAsync({END_DATE:newEndDate}).then(()=>{
                queryclient.refetchQueries(['users'],{exact:true,throwOnError:true}).then(()=>resolve()).catch(err=>reject(err))
            }).catch(err=>reject(err))
        }),{
            pending: `${capitalize(words[1])} user...`,
            success: `User ${words[2]} successfully.`,
            error: errorToast(`Failed to ${words[0]} user.`)
        });
    },[user]);
    return null;
}

function DeleteUser({user,setDeleteUser}) {
    const [show,setShow] = useState(true);
    const queryclient = useQueryClient();
    const {deleteUser} = useUserQueries(user.SUNY_ID);
    const del = deleteUser();

    const buttons = {
        close: {
            title: 'Cancel',
            callback: () => {
                setShow(false);
                setDeleteUser({});
            }
        },
        confirm:{
            title: 'Delete',
            variant: 'danger',
            callback: () => {
                del.mutateAsync().then(() => {
                    queryclient.refetchQueries(['users'],{exact:true,throwOnError:true}).then(() => {
                        setShow(false);
                        setDeleteUser({});
                        toast.success('User deleted successfully');
                    });
                }).catch(e => {
                    setShow(false);
                    setDeleteUser({});
                    toast.error('Failed to delete user');
                });
            }
        }
    }

    return (
        <ModalConfirm show={show} icon="mdi:account-alert" title="Delete User?" buttons={buttons}>
            <p>Are you sure you want to <strong>delete</strong> {user.fullName} ({user.SUNY_ID})?  This cannot be undone.</p>
        </ModalConfirm>
    );
}

function AddEditUserForm(props) {
    const tabs = [
        {id:'info',title:'Info'},
        {id:'groups',title:'Groups'},
    ];
    const defaultStatus = {state:'',message:'',icon:'',spin:false,cancel:true,save:false};

    const [activeTab,setActiveTab] = useState('info');
    const [status,setStatus] = useReducer((state,args) => {
        let presets = {};
        switch(args.state) {
            case "error": presets = {icon:'mdi:alert',spin:false,save:true,cancel:true}; break;
            case "saving": presets = {message:'Saving...',icon:'mdi:loading',spin:true,cancel:false,save:false}; break;
            case "loading": presets = {message:'Loading...',icon:null,spin:false,save:false}; break;
            case "clear": presets = defaultStatus; break;
        }
        return Object.assign({},state,presets,args);
    },defaultStatus);

    const methods = useForm({
        mode:'onSubmit',
        reValidateMode:'onChange',
        defaultValues:Object.assign({},defaultVals,{
            SUNYID: props.SUNY_ID||'',
            bNumber: props.B_NUMBER||'',
            firstName:props.LEGAL_FIRST_NAME||'',
            lastName:props.LEGAL_LAST_NAME||'',
            email:props.email||'',
            notifications:props.NOTIFICATIONS,
            dept:props.REPORTING_DEPARTMENT_NAME||'No Department',
            deptGroupId:props.GROUP_ID||'',
            deptGroup:props.GROUP_NAME||'N/A',
            startDate: props.startDate||new Date(),
            endDate: props.endDate||''
        })
    });
    const [firstName,lastName] = methods.watch(['firstName','lastName']);

    const queryclient = useQueryClient();
    const {getUserGroups,postUser,putUser} = useUserQueries(props.SUNY_ID);
    const {getGroups} = useGroupQueries();
    const groups = getGroups({enabled:false,select:data=>sortBy(data.filter(g=>g.active),['GROUP_NAME'])});
    const usergroups = getUserGroups({enabled:false,select:data=>sortBy(data.filter(g=>g.active),['GROUP_NAME'])});
    const updateuser = putUser();
    const createuser = postUser();

    const navigate = tab => {
        setActiveTab(tab);
    }
    const closeModal = () => {
        if (status.state == 'saving') return false;
        props.setSelectedRow({});
        props.setNewUser(false);
    }
    
    const handleSave = data => {
        console.debug(data);
        if (!Object.keys(methods.formState.dirtyFields).length &&!props.newUser) {
            toast.info('No changes to user data');
            closeModal();
            return true;
        }
        const origIds = (usergroups.data)?usergroups.data.map(g=>g.GROUP_ID):[];
        const newIds = data.assignedGroups.map(g=>g.GROUP_ID);
        const addGroups = difference(newIds,origIds);
        const delGroups = difference(origIds,newIds);
        const reqData = {
            SUNY_ID:data.SUNYID,
            START_DATE:format(data.startDate,'dd-MMM-yyyy'),
            END_DATE:(data.endDate)?format(data.endDate,'dd-MMM-yyyy'):'',
            ADD_GROUPS:addGroups,
            DEL_GROUPS:delGroups,
            OPTIONS:{
                notifications:data.notifications
            }
        }
        setStatus({state:'saving'});
        if (!props.newUser) {
            updateuser.mutateAsync(reqData).then(()=>{
                Promise.all([
                    queryclient.refetchQueries('users',{exact:true,throwOnError:true}),
                    queryclient.refetchQueries(['usergroups',props.SUNY_ID],{exact:true,throwOnError:true})
                ]).then(() => {
                    setStatus({state:'clear'});
                    toast.success('User updated successfully');
                    closeModal();
                });
            }).catch(e => {
                setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
            });
        } else {
            createuser.mutateAsync(reqData).then(()=>{
                queryclient.refetchQueries('users',{exact:true,throwOnError:true}).then(() => {
                    setStatus({state:'clear'});
                    toast.success('User created successfully');
                    closeModal();
                });
            }).catch(e => {
                setStatus({state:'error',message:e.description || `${e.name}: ${e.message}`});
            });
        }
    }

    const handleError = error => {
        const msg = Object.keys(error).map(k=>error[k]?.message && <p key={k} className="mb-0">{error[k]?.message}</p>);
        setStatus({state:'error',message:msg});
    }

    useEffect(() => {
        setStatus({state:'loading'});
        groups.refetch().then(({data:groupsData}) => {
            if (props.newUser) {
                setStatus({state:'clear'});
                methods.reset(Object.assign({},defaultVals,{
                    availableGroups:groupsData
                }));
            } else {
                usergroups.refetch().then(({data:usergroupData}) => {
                    const assignedIds = usergroupData.map(g=>g.GROUP_ID);
                    const filtered = groupsData.filter(g=>!assignedIds.includes(g.GROUP_ID));
                    methods.reset({
                        SUNYID:props.SUNY_ID,
                        bNumber:props.B_NUMBER,
                        firstName:props.LEGAL_FIRST_NAME,
                        lastName:props.LEGAL_LAST_NAME,
                        dept:props.REPORTING_DEPARTMENT_NAME||'',
                        deptGroupId:props.GROUP_ID||'',
                        deptGroup:props.GROUP_NAME||'',
                        email:props.email,
                        notifications:props.NOTIFICATIONS,
                        startDate: props.startDate,
                        endDate: props.endDate,
                        assignedGroups:usergroupData,
                        availableGroups:filtered
                    });
                    setStatus({state:'clear',save:true});
                });
            }
        })
    },[props.SUNY_ID,props.newUser]);
    return (
        <Modal show={true} onHide={closeModal} backdrop="static" size="lg">
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(handleSave,handleError)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{props.newUser && `New `}User: {firstName} {lastName}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {status.state == 'error' && <Alert variant="danger">{status.message}</Alert>}
                        {status.state == 'loading' && <Loading type="alert" variant="info">Loading User Information...</Loading>}
                        {status.state != 'loading' && <Tabs activeKey={activeTab} onSelect={navigate} id="admin-groups-tabs">
                            {tabs.map(t=>(
                                <Tab key={t.id} eventKey={t.id} title={t.title}>
                                    <Container className="mt-3" fluid>
                                        <TabRouter tab={activeTab} newUser={props.newUser} setStatus={setStatus} closeModal={closeModal}/>
                                    </Container>
                                </Tab>
                            ))}
                        </Tabs>}
                    </Modal.Body>
                    <Modal.Footer>
                        {status.state != 'error' && <p>{status.message}</p>}
                        <AppButton format="close" onClick={closeModal} disabled={!status.cancel}>Cancel</AppButton>
                        <AppButton format="save" type="submit" disabled={!(status.save&&Object.keys(methods.formState.errors).length==0)} icon={status.icon} spin={status.spin}>Save</AppButton>
                    </Modal.Footer>
                </Form>
            </FormProvider>
        </Modal>
    );
}

const TabRouter = React.memo(({tab,newUser,setStatus,closeModal}) => {
    switch(tab) {
        case "info": return <UserInfo newUser={newUser} setStatus={setStatus} closeModal={closeModal}/>;
        case "groups": return <UserGroups/>;
        default: return <NotFound/>;
    }
});

function UserInfo({newUser,setStatus,closeModal}) {
    const lookupStateDefault = {
        state:'',
        icon:'mdi:account-search',
        variant:'secondary',
        spin:false
    };
    const { control, watch, reset, getValues, setValue, setError, formState: { errors } } = useFormContext();
    const sunyid = watch('SUNYID');

    const [lookupState,setLookupState] = useReducer((state,action) => {
        switch(action) {
            case 'error':
            case 'invalid': return {state:'invalid',icon:'mdi:account-alert',variant:'danger',spin:false};
            case 'valid': return {state:'valid',icon:'mdi:account-check',variant:'success',spin:false};
            case 'search': return {state:'search',icon:'mdi:loading',variant:'secondary',spin:true};
            default: return lookupStateDefault;
        }
    },lookupStateDefault);

    const queryclient = useQueryClient();
    const {lookupUser} = useUserQueries(sunyid);
    const lookupuser = lookupUser({enabled:false});
    const ref = useRef();
    
    const handleLookup = () => {
        if (!sunyid) {
            setLookupState('invalid');
            setStatus({save:false});
            setError("SUNYID",{type:'required',message:'You must enter a SUNY ID'});
            return;
        }
        const userExists = queryclient.getQueryData('users').find(u=>u.SUNY_ID==sunyid);
        if (userExists) {
            setLookupState('invalid');
            setStatus({save:false});
            setError("SUNYID",{type:'manual',message:'User Already Exists'});
            return;
        }
        setLookupState('search');
        lookupuser.refetch().then(d => {
            if (d.isError) {
                setLookupState('error');
                setStatus({save:false});
                setError("SUNYID",{type:'manual',message:d.error?.description});
                return false;    
            }
            const userData = d.data[0];
            if (!userData) {
                setLookupState('error');
                setStatus({save:false});
                setError("SUNYID",{type:'manual',message:'Invalid SUNY ID'});
                return false;    
            }
            setLookupState('valid');
            setStatus({save:true});
            reset(Object.assign({},defaultVals,{
                SUNYID:userData.SUNY_ID||'',
                bNumber:userData.B_NUMBER||'',
                firstName:userData.LEGAL_FIRST_NAME||'',
                lastName:userData.LEGAL_LAST_NAME||'',
                email:userData.EMAIL_ADDRESS_WORK||'',
                notifications:userData.NOTIFICATIONS,
                dept:userData.REPORTING_DEPARTMENT_NAME||'',
                deptGroupId:userData.GROUP_ID||'',
                deptGroup:userData.GROUP_NAME||'',
            }));
        });
    }
    const handleChange = (e,field) => {
        field.onChange(e);
        if (lookupState.state == 'valid') {
            setLookupState('reset');
            setStatus({save:false});
            ['firstName','lastName','email'].forEach(v=>setValue(v,'')); //reset firstName, lastName, and email
        }
    }
    const handleCheck = (e,field)=>field.onChange((e.target.checked)?"Y":"N");
    const handleKeyDown = e => {
        if (e.key == 'Enter') {
            e.preventDefault();
            handleLookup();
            return true;
        }
        if (e.key == 'Escape') {
            e.preventDefault();
            if (!sunyid) {
                closeModal();
            } else {
                setLookupState('clear');
                reset(defaultVals);
                return true;
            }
        }
    }

    useEffect(() => { newUser && ref.current.focus();},[]);
    return (
        <>
            <Form.Row>
                <Form.Group as={Col} controlId="suny_id">
                    <Form.Label>SUNY ID:</Form.Label>
                    {newUser?
                        <InputGroup hasValidation className="mb-3">
                            <Controller
                                name="SUNYID"
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} ref={ref} type="text" placeholder="Search for SUNY ID" aria-label="Search for SUNY ID" aria-describedby="basic-addon" onKeyDown={handleKeyDown} onChange={e=>handleChange(e,field)} isInvalid={errors.SUNYID}/>}
                            />
                            <InputGroup.Append>
                                <AppButton format="search" variant={lookupState.variant} title="Search" onClick={handleLookup} icon={lookupState.icon} spin={lookupState.spin}></AppButton>
                            </InputGroup.Append>
                            <Form.Control.Feedback type="invalid">{errors.SUNYID?.message}</Form.Control.Feedback>
                        </InputGroup>
                    :
                        <Controller
                            name="SUNYID"
                            defaultValue=""
                            control={control}
                            render={({field}) => <Form.Control {...field} type="text" disabled/>}
                        />
                    }
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="bNumber">
                    <Form.Label>B#:</Form.Label>
                    <Controller
                        name="bNumber"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" disabled/>}
                    />
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="first_name">
                    <Form.Label>First Name:</Form.Label>
                    <Controller
                        name="firstName"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" disabled/>}
                    />
                </Form.Group>
                <Form.Group as={Col} controlId="last_name">
                    <Form.Label>Last Name:</Form.Label>
                    <Controller
                        name="lastName"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" disabled/>}
                    />
                </Form.Group>            
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="email">
                    <Form.Label>Email:</Form.Label>
                    <Controller
                        name="email"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" disabled/>}
                    />
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="notifications">
                    <Form.Label>Email Notifications:</Form.Label>
                    <Controller
                        name="notifications"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Check {...field} type="checkbox" onChange={e=>handleCheck(e,field)} value="Y" checked={field.value=="Y"} aria-describedby="notificationHelp"/>}
                    />
                    <Form.Text id="notificationHelp" muted>Users in approval groups will receive email notification when a new approval is assigned to the group.</Form.Text>
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="dept">
                    <Form.Label>Department:</Form.Label>
                    <Controller
                        name="dept"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" disabled/>}
                    />
                </Form.Group>
                <Form.Group as={Col} controlId="dept_group">
                    <Form.Label><Link to={`/admin/groups/${getValues('deptGroupId')}`}>Department Group</Link></Form.Label>:
                    <Controller
                        name="deptGroup"
                        defaultValue=""
                        control={control}
                        render={({field}) => <Form.Control {...field} type="text" disabled/>}
                    />
                </Form.Group>
            </Form.Row>
            <Form.Row>
                <Form.Group as={Col} controlId="start_date">
                    <Form.Label>Start Date:</Form.Label>
                    <InputGroup>
                        <Controller
                            name="startDate"
                            defaultValue=""
                            control={control}
                            rules={{required:{value:true,message:'Start Date is required'}}}
                            render={({field}) => <Form.Control {...field} as={DatePicker} selected={field.value} isInvalid={errors.startDate}/>}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text>
                                <Icon icon="mdi:calendar-blank"/>
                            </InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                    <Form.Control.Feedback type="invalid">{errors.startDate?.message}</Form.Control.Feedback>                    
                </Form.Group>
                <Form.Group as={Col} controlId="end_date">
                    <Form.Label>End Date:</Form.Label>
                    <InputGroup>
                        <Controller
                            name="endDate"
                            defaultValue=""
                            control={control}
                            render={({field}) => <Form.Control {...field} as={DatePicker} selected={field.value} autoComplete="off"/>}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text>
                                <Icon icon="mdi:calendar-blank"/>
                            </InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                </Form.Group>
            </Form.Row>
        </>
    );
}

function UserGroups() {
    const ref = useRef();
    const [filterText,setFilterText] = useState('');
    const [filteredGroups,setFilteredGroups] = useState([]);
    const { getValues} = useFormContext();
    const handleOnKeyDown = e => {
        if (e.key == 'Escape') {
            e.stopPropagation();
            setFilterText('');
        }
    }
    const handleOnChange = e => setFilterText(e.target.value);
    useEffect(() => {
        const filtered = getValues('availableGroups').filter(row =>{
            return Object.values(flattenObject(row)).filter(r=>!!r).map(r=>r.toString().toLowerCase()).join(' ').includes(filterText.toLowerCase());
        }).map(f=>f.GROUP_ID);
        setFilteredGroups(filtered);
    },[filterText]);
    useEffect(()=>ref.current.focus(),[]);
    return (
        <>
            <Form.Row>
                <Form.Group as={Col}>
                    <Form.Label>Filter Groups:</Form.Label>
                    <Form.Control ref={ref} type="search" placeholder="filter available groups..." value={filterText} onChange={handleOnChange} onKeyDown={handleOnKeyDown}/>
                </Form.Group>
            </Form.Row>
            <div className="drag-col-2">
                <div className="dlh1">Unassigned Groups</div>
                <div className="dlh2">Assigned Groups</div>
                <UserGroupsList filteredGroups={filteredGroups} filterText={filterText}/>
            </div>
        </>
    );
}

function UserGroupsList({filteredGroups,filterText}) {
    const { control } = useFormContext();
    const { insert:insertAssignedGroups, remove:removeAssignedGroups } = useFieldArray({control:control,name:'assignedGroups'});
    const { insert:insertAvailableGroups, remove:removeAvailableGroups } = useFieldArray({control:control,name:'availableGroups'});
    const assignedgroups = useWatch({name:'assignedGroups',control:control});
    const availablegroups = useWatch({name:'availableGroups',control:control});

    const onDragEnd = ({source,destination}) => {
        if (source.droppableId == destination.droppableId) return false; //no reordering
        if (source.droppableId == 'available') {
            insertAssignedGroups(destination.index,availablegroups[source.index]);
            removeAvailableGroups(source.index);
        }
        if (source.droppableId == 'assigned') {
            insertAvailableGroups(destination.index,assignedgroups[source.index]);
            removeAssignedGroups(source.index);
        }
    }
    const handleDblClick = useCallback(e => {
        const {list,idx} = e.target.dataset;
        onDragEnd({
            source:{droppableId:list,index:parseInt(idx,10)},
            destination:{droppableId:(list=='available'?'assigned':'available'),index:0}
        });
    },[availablegroups,assignedgroups]);
    return(
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="available">
                {(provided, snapshot) => ( 
                    <div ref={provided.innerRef} className={`droplist dl1 ${snapshot.isDraggingOver?'over':''}`}>
                        {availablegroups.map((g,i) => {
                            if (filterText&&!filteredGroups.includes(g.GROUP_ID)) return null;
                            return (
                                <Draggable key={g.GROUP_ID} draggableId={g.GROUP_ID} index={i}>
                                    {(provided,snapshot) => (
                                        <div
                                            ref={provided.innerRef} 
                                            {...provided.draggableProps} 
                                            {...provided.dragHandleProps}
                                            className={snapshot.isDragging?'dragging':''}
                                            onDoubleClick={handleDblClick}
                                            data-list="available" data-idx={i}
                                        >
                                            {g.GROUP_NAME}
                                        </div>
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
            <Droppable droppableId="assigned">
                {(provided, snapshot) => ( 
                    <div ref={provided.innerRef} className={`droplist dl2 ${snapshot.isDraggingOver?'over':''}`}>
                        {assignedgroups.map((g,i) => (
                            <Draggable key={g.GROUP_ID} draggableId={g.GROUP_ID} index={i}>
                                {(provided,snapshot) => (
                                    <div
                                        ref={provided.innerRef} 
                                        {...provided.draggableProps} 
                                        {...provided.dragHandleProps}
                                        className={snapshot.isDragging?'dragging':''}
                                        onDoubleClick={handleDblClick}
                                        data-list="assigned" data-idx={i}
                                    >
                                        {g.GROUP_NAME}
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}