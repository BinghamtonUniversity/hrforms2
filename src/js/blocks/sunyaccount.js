import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { Row, Col, Form, InputGroup, Button, Table } from "react-bootstrap";
import { Controller, useWatch, useFieldArray, useFormContext } from "react-hook-form";
import { useAppQueries } from "../queries";
import { Typeahead, Hint } from "react-bootstrap-typeahead";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { get } from "lodash";
import { Loading } from "./components";


export default function SUNYAccount() {
    const {control,setValue,formState:{errors}} = useFormContext();
    const { fields, append, update, remove } = useFieldArray({control,name:'SUNYAccounts'});

    const [showSplit,setShowSplit] = useState(false);

    const {getListData} = useAppQueries();
    const accounts = getListData('accounts',{select:d=>{
        return d.map(a=>{return {id:a.ACCOUNT_CODE,label:`${a.ACCOUNT_CODE} - ${a.ACCOUNT_DESCRIPTION}`}});
    }});

    const toggleSplit = () => {
        if (!showSplit){
            //make sure there are at least 2 accounts and set first account pct to empty
            for (let i = fields.length;i<2;i++) {
                append({account:[],pct:''},{focusName:'SUNYAccounts.0.pct'});
            }
            setValue('SUNYAccounts.0.pct','');
        } else {
            //remove splits
            for (let i=1;i<fields.length;i++) {
                remove(i);
            }
            setValue('SUNYAccounts.0.pct','100');
        }
        setShowSplit(!showSplit);
    }
    const splitAction = (action,index) => {
        if (action=='add') append({account:[],pct:''});
        if (action=='remove') {
            remove(index);
            if (fields.length <= 2) toggleSplit();
        }
    }

    return(
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>SUNY Account:</Form.Label>
                <Col id="col-SUNYAccount">
                    {accounts.isLoading && <Loading>Loading SUNY Accounts</Loading>}
                    {accounts.isError && <Loading isError>Error Loading SUNY Accounts</Loading>}
                    {accounts.data && 
                        <InputGroup>
                            <Controller
                                name="SUNYAccounts.0.account"
                                defaultValue=""
                                control={control}
                                render={({field})=><Typeahead {...field} id="SUNYAccounts-0" options={accounts.data} flip={true} minLength={2} allowNew={true} selected={field.value} disabled={showSplit}/>}
                            />
                            <InputGroup.Append>
                                <Button variant={(showSplit)?'secondary':'primary'} onClick={toggleSplit}>Split</Button>
                            </InputGroup.Append>
                        </InputGroup>
                    }
                </Col>
            </Form.Group>
            {showSplit && <SplitTable accounts={accounts.data} fields={fields} splitAction={splitAction}/>}
        </>
    );
}

function SplitTable({accounts,fields,splitAction}) {
    const [splitPct,setSplitPct] = useState(0);
    
    const {control,formState:{errors}} = useFormContext();
    const watchSUNYAccounts = useWatch({name:'SUNYAccounts',control:control});

    useEffect(() => {
        if (!watchSUNYAccounts) return;
        let total = 0;
        watchSUNYAccounts.forEach(s=>total+=parseInt(s.pct||0,10));
        setSplitPct(total);
    },[watchSUNYAccounts]);

    return (
        <Table className="split-account-table" striped bordered>
            <thead>
                <tr>
                    <th scope="col">Action</th>
                    <th scope="col">Account</th>
                    <th scope="col">Percent</th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <td colSpan={2}>Total:</td>
                    <td className="text-right"><span className={(splitPct==100)?'text-success':'text-danger'}>{splitPct}%</span></td>
                </tr>
            </tfoot>
            <tbody>
                {fields.map((field,index)=>{
                    return (
                        <tr key={field.id}>
                            <td>
                                {index >0 && 
                                    <>
                                        <Button className="mr-2" variant="success" size="sm" onClick={()=>splitAction('add',index)} tabIndex="-1"><FontAwesomeIcon icon="plus-square"/></Button>
                                        <Button variant="danger" size="sm" onClick={()=>splitAction('remove',index)} tabIndex="-1"><FontAwesomeIcon icon="minus-square"/></Button>
                                    </>
                                }
                            </td>
                            <td>
                                {accounts &&
                                    <Controller
                                        name={`SUNYAccounts.${index}.account`}
                                        defaultValue=""
                                        control={control}
                                        render={({field})=><Typeahead {...field} id={`SUNYAccounts-${index}`} options={accounts} flip={true} minLength={2} allowNew={true} selected={field.value}/>}
                                    />
                                }
                            </td>
                            <td className="text-right">
                                <Controller
                                    name={`SUNYAccounts.${index}.pct`}
                                    defaultValue=""
                                    rules={{
                                        min:{value:1,message:'Percentage cannot be less than 1'},
                                        max:{value:100,message:'Percentage cannot be more than 100'}
                                    }}
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="number" title={get(errors.SUNYAccounts,`${index}.pct.message`)} isInvalid={get(errors.SUNYAccounts,`${index}.pct`)}/>}
                                />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
}

/*
export default function SUNYAccount() {
    const [showSplit,setShowSplit] = useState(false);
    const {control,setValue,formState:{errors}} = useFormContext();
    const { fields, append, update, remove } = useFieldArray({control,name:'SUNYAccounts'});

    const {getListData} = useAppQueries();
    const accounts = getListData('accounts',{select:d=>{
        return d.map(a=>{return {id:a.ACCOUNT_CODE,label:`${a.ACCOUNT_CODE} - ${a.ACCOUNT_DESCRIPTION}`}});
    }});
    const toggleSplit = () => {
        if (!showSplit) {
            //make sure there are 2 fields if we show the split table
            console.log(fields);
            for (let i = fields.length;i<2;i++) {
                append({account:{id:'',label:''},pct:''},{focusIndex:0});
            }
        }
        setShowSplit(!showSplit);
        setValue('SUNYAccountSplit',!showSplit);
    }
    const handleSplit = (action,index) => {
        if (action == 'add') append({account:{id:'',label:''},pct:""},{shouldFocus:true,focusIndex:index+1});
        if (action == 'remove') {
            remove(index);
            if (fields.length <= 2) toggleSplit();    
        }
    }
    const updateSplit = (index,value) => {
        console.log('update split:',index,value);
        update(index,Object.assign(fields[index],{account:value[0]}));
        console.log(fields);
    }
    return(
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>SUNY Account:</Form.Label>
                <Col id="col-SUNYAccount">
                    {accounts.isLoading && <Loading>Loading SUNY Accounts</Loading>}
                    {accounts.isError && <Loading isError>Error Loading SUNY Accounts</Loading>}
                    {accounts.data && 
                        <InputGroup>
                            <AccountTypeAhead accounts={accounts.data} index={0} field={{...fields[0],disabled:(showSplit)}} updateSplit={updateSplit}/>
                            <InputGroup.Append>
                                <Button variant={(showSplit)?'secondary':'primary'} onClick={toggleSplit}>Split</Button>
                            </InputGroup.Append>
                        </InputGroup>
                    }
                </Col>
            </Form.Group>            
            {showSplit&&<AccountSplits control={control} fields={fields} accounts={accounts.data} errors={errors} handleSplit={handleSplit} updateSplit={updateSplit}/>}
        </>
    );
}

function AccountSplits({control,fields,accounts,errors,handleSplit,updateSplit}) {
    const [splitPct,setSplitPct] = useState(0);
    const watchSUNYAccounts = useWatch({name:'SUNYAccounts',control:control});

    useEffect(() => {
        if (!watchSUNYAccounts) return;
        let total = 0;
        watchSUNYAccounts.forEach(s=>total+=parseInt(s.pct||0,10));
        setSplitPct(total);
    },[watchSUNYAccounts]);
    return (
        <Table className="split-account-table" striped bordered>
            <thead>
                <tr>
                    <th scope="col">Action</th>
                    <th scope="col">Account</th>
                    <th scope="col">Percent</th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <td colSpan={2}>Total:</td>
                    <td className="text-right"><span className={(splitPct==100)?'text-success':'text-danger'}>{splitPct}%</span></td>
                </tr>
            </tfoot>
            <tbody>
                {fields.map((field,index)=>{
                    return (
                        <tr key={field.id}>
                            <td>
                                {index>0 &&
                                    <>
                                        <Button className="mr-2" variant="success" size="sm" onClick={()=>handleSplit('add',index)}><FontAwesomeIcon icon="plus-square"/></Button>
                                        <Button variant="danger" size="sm" onClick={()=>handleSplit('remove',index)}><FontAwesomeIcon icon="minus-square"/></Button>
                                    </>
                                }
                            </td>
                            <td>
                                {accounts && <AccountTypeAhead accounts={accounts} index={index} field={field} updateSplit={updateSplit}/>}
                            </td>
                            <td className="text-right">
                                <Controller
                                    name={`SUNYAccounts.${index}.pct`}
                                    defaultValue=""
                                    rules={{
                                        min:{value:1,message:'Percentage cannot be less than 1'},
                                        max:{value:100,message:'Percentage cannot be more than 100'}
                                    }}
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="number" title={get(errors.SUNYAccounts,`${index}.pct.message`)} isInvalid={get(errors.SUNYAccounts,`${index}.pct`)}/>}
                                />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
}


function AccountTypeAhead({accounts,field,index,updateSplit}) {
    const [acctNum,setAcctNum] = useState([]);
    const acctNumChange = v => {
        console.log(v);
        setAcctNum(v);
        updateSplit(index,v);
    }
    useEffect(() => {
        field.account && setAcctNum([field.account]);
    },[index]);
    return (
        <Typeahead id={`SUNYAccount-${index}`} options={accounts} flip={true} minLength={2} allowNew={true} selected={acctNum} onChange={acctNumChange} disabled={field.disabled}/>
    );
}
*/