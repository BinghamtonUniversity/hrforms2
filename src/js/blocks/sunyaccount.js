import React, { useCallback, useEffect, useState } from "react";
import { Row, Col, Form, InputGroup, Button, Table } from "react-bootstrap";
import { Controller, useWatch, useFieldArray } from "react-hook-form";
import { useAppQueries } from "../queries";
import { Typeahead } from "react-bootstrap-typeahead";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { get } from "lodash";
import { Loading } from "./components";

/***
 * TODO: Autofocus issue with split table
 */

export default function SUNYAccount({control,errors}) {
    const [previousSplit,setPreviousSplit] = useState([]);
    const [showSplit,setShowSplit] = useState(false);
    const watchSUNYAccounts = useWatch({name:'SUNYAccounts',control:control});
    const { fields, append, update, replace } = useFieldArray({control,name:'SUNYAccounts'});

    const {getListData} = useAppQueries();
    const accounts = getListData('accounts',{select:d=>{
        return d.map(a=>{return {id:a.ACCOUNT_CODE,label:`${a.ACCOUNT_CODE} - ${a.ACCOUNT_DESCRIPTION}`}});
    }});
    const toggleSplit = () => {
        console.log('toggle:',fields);
        console.log(watchSUNYAccounts);
        if (!showSplit) {
            console.log('showing split table');
            if (previousSplit.length != 0) {
                console.log('use prev splits');
                console.log('prev:',previousSplit);
                replace(previousSplit);
            } else {
                console.log('use value in fields and add');
                for (let i = fields.length;i<2;i++) {
                    append({account:{id:'',label:''},pct:''});
                }
            }
        } else {
            console.log('hiding split table');
            setPreviousSplit(fields);
            //remove fields > 0
            replace([fields[0]]);
        }

        setShowSplit(!showSplit);
        //if (fields.length < 2) {
            
            //if (fields.length < 2) append({account:'',pct:''},{focusIndex:0});
            //if (previousSplit.length > 1) replace(previousSplit);
        //} else {
            //replace([{account:previousSplit[0].account,pct:'100'}]);
        //}
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
                            <AccountTypeAhead accounts={accounts.data} index={0} field={{...fields[0],disabled:(showSplit)}} update={update}/>
                            <InputGroup.Append>
                                <Button variant={(showSplit)?'secondary':'primary'} onClick={toggleSplit}>Split</Button>
                            </InputGroup.Append>
                        </InputGroup>
                    }
                </Col>
            </Form.Group>
            {showSplit&&<AccountSplits control={control} accounts={accounts.data} setPreviousSplit={setPreviousSplit} errors={errors} toggleSplit={toggleSplit}/>}
        </>
    );
}

function AccountSplits({control,accounts,setPreviousSplit,errors,toggleSplit}) {
    const { fields, update, append, remove } = useFieldArray({control,name:'SUNYAccounts'});
    //TODO: add/remove functions
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
                    <td className="text-right">###%</td>
                </tr>
            </tfoot>
            <tbody>
                {fields.map((field,index)=>{
                    return (
                        <tr key={field.id}>
                            <td>
                                <Button className="mr-2" variant="success" size="sm" onClick={()=>append({account:{id:'',label:''},pct:""})}><FontAwesomeIcon icon="plus-square"/></Button>
                                <Button variant="danger" size="sm" onClick={()=>removeSplit(index)}><FontAwesomeIcon icon="minus-square"/></Button>
                            </td>
                            <td>
                                {accounts && <AccountTypeAhead accounts={accounts} index={index} field={field} update={update}/>}
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

function AccountSplitsOLD({control,accounts,setPreviousSplit,errors,toggleSplit}) {
    const [splitPct,setSplitPct] = useState(0);
    const watchSUNYAccounts = useWatch({name:'SUNYAccounts',control:control});

    const { fields, update, append, remove } = useFieldArray({control,name:'SUNYAccounts'});

    const removeSplit = index => {
        console.log('**remove**');
        console.log(index);
        console.log(fields);
        console.log(watchSUNYAccounts);
        if (fields.length == 2) {
            console.log('remove and close split');
            remove(index);
            console.log(fields);
        } else {
            remove(index);
        }
    }

    useEffect(() => {
        console.log('watch:',watchSUNYAccounts);
        if (!watchSUNYAccounts) return;
        if (watchSUNYAccounts.length == 0) {
            toggleSplit();
            return;
        }
        let total = 0;
        watchSUNYAccounts.forEach(s=>total += parseInt(s.pct||0,10));
        setSplitPct(total);
        setPreviousSplit(watchSUNYAccounts);
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
                                <Button className="mr-2" variant="success" size="sm" onClick={()=>append({account:"",pct:""})}><FontAwesomeIcon icon="plus-square"/></Button>
                                <Button variant="danger" size="sm" onClick={()=>removeSplit(index)}><FontAwesomeIcon icon="minus-square"/></Button>
                            </td>
                            <td>
                                {accounts && <AccountTypeAhead accounts={accounts} index={index} field={field} update={update}/>}
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

function AccountTypeAhead({accounts,field,index,update}) {
    const [acctNum,setAcctNum] = useState([]);
    const acctNumChange = v => {
        setAcctNum(v);
        update(index,{account:v[0],pct:field.pct||''});
    }
    useEffect(() => {
        field.account && setAcctNum([field.account]);
    },[index]);
    return (
        <Typeahead id={`SUNYAccount-${index}`} options={accounts} flip={true} minLength={2} allowNew={true} selected={acctNum} onChange={acctNumChange} disabled={field.disabled}/>
    );
}
