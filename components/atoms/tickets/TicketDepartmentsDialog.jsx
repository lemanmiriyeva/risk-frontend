"use client"
import React, {useEffect, useState} from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {C} from "@/components/theme/tokens";

function DepartmentRow({dept, item, onChange, onRemove, disabled}) {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        let alive = true;
        service_api.get(`${NEXT_API_ENDPOINTS.TICKETS.USERS}?department=${dept.id}`)
            .then((r) => alive && setUsers(r.data || []))
            .catch(() => alive && setUsers([]));
        return () => {alive = false;};
    }, [dept.id]);

    return (
        <Box sx={{display: 'flex', gap: 1.5, alignItems: 'flex-start', p: 1.5, border: `1px solid ${C.line}`, borderRadius: '4px', mb: 1.25}}>
            <Box sx={{flex: 1, minWidth: 0}}>
                <Typography sx={{fontSize: 14, fontWeight: 600}}>{dept.title}</Typography>
                <Typography sx={{fontSize: 12, color: C.inkFaint, mb: 1}}>
                    {dept.manager_name ? `Rəhbər: ${dept.manager_name}` : 'Rəhbər təyin olunmayıb'}
                </Typography>
                <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                    <TextField
                        select size="small" label="Şöbə daxili icraçı" value={item.assignee ?? ''} disabled={disabled}
                        onChange={(e) => onChange({...item, assignee: e.target.value === '' ? null : e.target.value})}
                        sx={{minWidth: 220, flex: 1}}
                    >
                        <MenuItem value="">— Təyin olunmayıb —</MenuItem>
                        {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
                    </TextField>
                    <TextField
                        size="small" label="Qeyd (istəyə bağlı)" value={item.note || ''} disabled={disabled}
                        onChange={(e) => onChange({...item, note: e.target.value})} sx={{minWidth: 220, flex: 1}}
                        inputProps={{maxLength: 500}}
                    />
                </Box>
            </Box>
            <IconButton size="small" onClick={onRemove} disabled={disabled}><CloseIcon fontSize="small"/></IconButton>
        </Box>
    );
}

/** Şöbə təyinatı: şöbələri əlavə et / çıxar, hər şöbə üçün icraçı və qeyd. */
export default function TicketDepartmentsDialog({open, onClose, ticket, departments, onSave, saving}) {
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (open && ticket) {
            setItems((ticket.department_links || []).map((l) => ({department: l.department, assignee: l.assignee, note: l.note || ''})));
        }
    }, [open, ticket]);

    const byId = Object.fromEntries((departments || []).map((d) => [d.id, d]));
    const selected = items.map((i) => byId[i.department]).filter(Boolean);

    function onPick(_, vals) {
        setItems((prev) => vals.map((v) => prev.find((p) => p.department === v.id) || {department: v.id, assignee: null, note: ''}));
    }

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{fontWeight: 600}}>Şöbələrə təyinat</DialogTitle>
            <DialogContent dividers>
                <Autocomplete
                    multiple size="small" options={departments || []} value={selected} disablePortal
                    getOptionLabel={(d) => d.title} isOptionEqualToValue={(a, b) => a.id === b.id}
                    onChange={onPick} filterSelectedOptions disabled={saving}
                    renderInput={(params) => <TextField {...params} label="Şöbə əlavə et" placeholder="Şöbə axtarın..."/>}
                    sx={{mb: 2}}
                />
                {items.map((item) => byId[item.department] && (
                    <DepartmentRow
                        key={item.department} dept={byId[item.department]} item={item} disabled={saving}
                        onChange={(next) => setItems((prev) => prev.map((p) => (p.department === item.department ? next : p)))}
                        onRemove={() => setItems((prev) => prev.filter((p) => p.department !== item.department))}
                    />
                ))}
                {!items.length && <Typography sx={{fontSize: 13, color: C.danger}}>Ən azı bir şöbə seçilməlidir.</Typography>}
            </DialogContent>
            <DialogActions sx={{px: 3, py: 2}}>
                <Button onClick={onClose} disabled={saving}>İmtina</Button>
                <Button variant="contained" disabled={saving || !items.length} onClick={() => onSave(items)}>
                    {saving ? <CircularProgress size={18} sx={{color: '#fff'}}/> : 'Yadda saxla'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}