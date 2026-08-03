"use client"
import React, {useEffect, useState} from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";

const OWNER_TYPES = [
    {value: 'person', label: 'Şəxs'},
    {value: 'department', label: 'Departament'},
    {value: 'aparat', label: 'Aparat (hamı üçün)'},
];

export default function InventoryFormDialog({open, onClose, onSaved, editingRow}) {
    const {enqueueSnackbar} = useSnackbar();
    const isEdit = !!editingRow;

    const [productName, setProductName] = useState('');
    const [ownerType, setOwnerType] = useState('person');
    const [personValue, setPersonValue] = useState(null);
    const [personOptions, setPersonOptions] = useState([]);
    const [personInput, setPersonInput] = useState('');
    const [departmentValue, setDepartmentValue] = useState(null);
    const [departmentOptions, setDepartmentOptions] = useState([]);
    const [departmentInput, setDepartmentInput] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setProductName(editingRow?.product_name || '');
            setOwnerType(editingRow?.owner_type || 'person');
            setPersonValue(editingRow?.owner_person ? {full_name: editingRow.owner_person.full_name} : null);
            setDepartmentValue(editingRow?.owner_department ? {name: editingRow.owner_department.name} : null);
        }
    }, [open, editingRow]);

    useEffect(() => {
        if (ownerType !== 'person') return;
        const t = setTimeout(async () => {
            try {
                const res = await service_api.get(`${NEXT_API_ENDPOINTS.INVENTORY.SEARCH_PERSONS}?q=${encodeURIComponent(personInput)}`);
                setPersonOptions(res.data || []);
            } catch (e) { /* səssiz */ }
        }, 250);
        return () => clearTimeout(t);
    }, [personInput, ownerType]);

    useEffect(() => {
        if (ownerType !== 'department') return;
        const t = setTimeout(async () => {
            try {
                const res = await service_api.get(`${NEXT_API_ENDPOINTS.INVENTORY.SEARCH_DEPARTMENTS}?q=${encodeURIComponent(departmentInput)}`);
                setDepartmentOptions(res.data || []);
            } catch (e) { /* səssiz */ }
        }, 250);
        return () => clearTimeout(t);
    }, [departmentInput, ownerType]);

    async function handleSave() {
        if (!productName.trim()) {
            enqueueSnackbar('Məhsulun adı boş ola bilməz', {variant: 'warning'});
            return;
        }
        if (ownerType === 'person' && !personValue?.full_name) {
            enqueueSnackbar('Şəxs seçilməlidir', {variant: 'warning'});
            return;
        }
        if (ownerType === 'department' && !departmentValue?.name) {
            enqueueSnackbar('Departament seçilməlidir', {variant: 'warning'});
            return;
        }

        const payload = {
            product_name: productName.trim(),
            owner_type: ownerType,
        };
        if (ownerType === 'person') payload.owner_person_name = personValue.full_name.trim();
        if (ownerType === 'department') payload.owner_department_name = departmentValue.name.trim();

        setSaving(true);
        try {
            if (isEdit) {
                await service_api.patch(NEXT_API_ENDPOINTS.INVENTORY.DETAIL + editingRow.id + '/', payload);
                enqueueSnackbar('İnventar yeniləndi', {variant: 'success'});
            } else {
                await service_api.post(NEXT_API_ENDPOINTS.INVENTORY.LIST, payload);
                enqueueSnackbar('İnventar yaradıldı', {variant: 'success'});
            }
            onSaved();
            onClose();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <Box sx={{px: 3, pt: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E4E1D8'}}>
                <Typography sx={{fontSize: 18, fontWeight: 600}}>
                    {isEdit ? 'İnventarı redaktə et' : 'Yeni inventar'}
                </Typography>
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small"/></IconButton>
            </Box>

            <Box sx={{px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2}}>
                <TextField
                    label="Məhsulun adı" value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    fullWidth size="small"
                />

                <TextField
                    select label="Sahib növü" value={ownerType}
                    onChange={(e) => setOwnerType(e.target.value)}
                    fullWidth size="small"
                >
                    {OWNER_TYPES.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                </TextField>

                {ownerType === 'person' && (
                    <Autocomplete
                        freeSolo
                        options={personOptions}
                        getOptionLabel={(o) => typeof o === 'string' ? o : (o.full_name || '')}
                        value={personValue}
                        inputValue={personInput}
                        onInputChange={(e, val) => setPersonInput(val)}
                        onChange={(e, val) => {
                            if (typeof val === 'string') setPersonValue({full_name: val});
                            else setPersonValue(val);
                        }}
                        onBlur={() => {
                            if (personInput && (!personValue || personValue.full_name !== personInput)) {
                                setPersonValue({full_name: personInput});
                            }
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Şəxs (ad soyad)" size="small"
                                       helperText="Siyahıdan seçin, yoxdursa yazın — avtomatik əlavə olunacaq"/>
                        )}
                    />
                )}

                {ownerType === 'department' && (
                    <Autocomplete
                        freeSolo
                        options={departmentOptions}
                        getOptionLabel={(o) => typeof o === 'string' ? o : (o.name || '')}
                        value={departmentValue}
                        inputValue={departmentInput}
                        onInputChange={(e, val) => setDepartmentInput(val)}
                        onChange={(e, val) => {
                            if (typeof val === 'string') setDepartmentValue({name: val});
                            else setDepartmentValue(val);
                        }}
                        onBlur={() => {
                            if (departmentInput && (!departmentValue || departmentValue.name !== departmentInput)) {
                                setDepartmentValue({name: departmentInput});
                            }
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Departament" size="small"
                                       helperText="Siyahıdan seçin, yoxdursa yazın — avtomatik əlavə olunacaq"/>
                        )}
                    />
                )}

                {ownerType === 'aparat' && (
                    <Typography sx={{fontSize: 13, color: '#6B6558'}}>
                        Bu inventar hamı üçün (Aparat) nəzərdə tutulacaq, əlavə seçim tələb olunmur.
                    </Typography>
                )}
            </Box>

            <Box sx={{px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                <Button onClick={onClose} disabled={saving}>Ləğv et</Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}
                        sx={{backgroundColor: '#9C7A2E', '&:hover': {backgroundColor: '#7d631f'}}}>
                    {saving ? <CircularProgress size={18} sx={{color: '#fff'}}/> : 'Yadda saxla'}
                </Button>
            </Box>
        </Dialog>
    );
}