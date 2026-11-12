"use client"
import React, {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import {useSnackbar} from "notistack";
import ModuleHero from "@/components/ModuleHero";
import {GOV, C} from "@/components/theme/tokens";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {PRIORITY_META} from "./ticketMeta";

const EMPTY = {title: '', code: '', description: '', color: '#0A6CC2', default_department: '', default_priority: 'medium', order: 10, is_active: true};

function slugify(s) {
    const map = {'ə': 'e', 'ı': 'i', 'ö': 'o', 'ü': 'u', 'ç': 'c', 'ş': 's', 'ğ': 'g'};
    return s.toLowerCase().replace(/[əıöüçşğ]/g, (c) => map[c]).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

export default function TicketCategoriesPage() {
    const {enqueueSnackbar} = useSnackbar();
    const [meta, setMeta] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);   // null | {id?, ...fields}
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [m, c] = await Promise.all([
                service_api.get(NEXT_API_ENDPOINTS.TICKETS.META),
                service_api.get(NEXT_API_ENDPOINTS.TICKETS.CATEGORIES),
            ]);
            setMeta(m.data);
            setRows(c.data?.results || c.data || []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => { load(); }, [load]);

    async function save() {
        const e = {};
        if (!editing.title.trim()) e.title = 'Ad daxil edin';
        if (!editing.code.trim()) e.code = 'Kod daxil edin';
        setErrors(e);
        if (Object.keys(e).length) return;
        setSaving(true);
        try {
            const payload = {...editing, default_department: editing.default_department || null};
            delete payload.default_department_title;
            if (editing.id) await service_api.patch(NEXT_API_ENDPOINTS.TICKETS.CATEGORY_DETAIL(editing.id), payload);
            else await service_api.post(NEXT_API_ENDPOINTS.TICKETS.CATEGORIES, payload);
            enqueueSnackbar('Kateqoriya yadda saxlanıldı.', {variant: 'success'});
            setEditing(null);
            load();
        } catch (err) {
            const data = err?.response?.data;
            if (data && typeof data === 'object') {
                setErrors(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.join(' ') : String(v)])));
            }
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    async function remove(row) {
        if (!window.confirm(`"${row.title}" kateqoriyası silinsin? (Müraciətləri varsa deaktiv ediləcək.)`)) return;
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.TICKETS.CATEGORY_DETAIL(row.id));
            load();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        }
    }

    const set = (k) => (e) => setEditing((c) => ({...c, [k]: e.target.value}));

    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="Müraciətlər" title="Kateqoriyalar" breadcrumb={["Müraciətlər", "Kateqoriyalar"]}
                icon={<ConfirmationNumberOutlinedIcon sx={{fontSize: 26}}/>}
                actions={<Button variant="contained" startIcon={<AddIcon/>} onClick={() => {setErrors({}); setEditing({...EMPTY});}}>Yeni kateqoriya</Button>}
            />
            <Box sx={{maxWidth: 1100, mx: 'auto', px: {xs: 2, sm: 4}, py: 4}}>
                <Button size="small" startIcon={<ArrowBackIcon/>} component={Link} href="/muracietler" sx={{mb: 2, color: C.inkMuted}}>Müraciətlərə qayıt</Button>
                <Typography sx={{fontSize: 13.5, color: C.inkMuted, mb: 2}}>
                    Kateqoriyanın defolt şöbəsi və prioriteti var: müraciətçi şöbə seçməsə, müraciət avtomatik həmin şöbəyə yönləndirilir.
                </Typography>
                {loading ? <Box sx={{textAlign: 'center', py: 8}}><CircularProgress/></Box> : (
                    <Box sx={{backgroundColor: C.surface, border: `1px solid ${C.line}`, borderRadius: '4px', overflowX: 'auto'}}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {['Kateqoriya', 'Kod', 'Defolt şöbə', 'Defolt prioritet', 'Sıra', 'Status', ''].map((h) => (
                                        <TableCell key={h} sx={{fontSize: 11, textTransform: 'uppercase', color: C.inkFaint, fontWeight: 600}}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((r) => (
                                    <TableRow key={r.id} hover sx={{opacity: r.is_active ? 1 : 0.55}}>
                                        <TableCell>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                <Box sx={{width: 12, height: 12, borderRadius: '3px', backgroundColor: r.color}}/>
                                                <Box>
                                                    <Typography sx={{fontSize: 14, fontWeight: 600}}>{r.title}</Typography>
                                                    {r.description && <Typography sx={{fontSize: 12, color: C.inkFaint}}>{r.description}</Typography>}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{fontFamily: 'monospace', fontSize: 12.5}}>{r.code}</TableCell>
                                        <TableCell>{r.default_department_title || '—'}</TableCell>
                                        <TableCell>{PRIORITY_META[r.default_priority]?.label}</TableCell>
                                        <TableCell>{r.order}</TableCell>
                                        <TableCell><Chip size="small" label={r.is_active ? 'Aktiv' : 'Deaktiv'} color={r.is_active ? 'success' : 'default'} variant="outlined"/></TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => {setErrors({}); setEditing({...r, default_department: r.default_department || ''});}}><EditOutlinedIcon fontSize="small"/></IconButton>
                                            <IconButton size="small" onClick={() => remove(r)}><DeleteOutlineIcon fontSize="small"/></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                )}
            </Box>

            <Dialog open={!!editing} onClose={() => !saving && setEditing(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{fontWeight: 600}}>{editing?.id ? 'Kateqoriyanı redaktə et' : 'Yeni kateqoriya'}</DialogTitle>
                {editing && (
                    <DialogContent dividers>
                        <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2, mt: 0.5}}>
                            <TextField size="small" label="Ad" value={editing.title} error={!!errors.title} helperText={errors.title}
                                       onChange={(e) => setEditing((c) => ({...c, title: e.target.value, code: c.id || c.code !== slugify(c.title) && c.code ? c.code : slugify(e.target.value)}))}/>
                            <TextField size="small" label="Kod (latın, unikal)" value={editing.code} error={!!errors.code} helperText={errors.code}
                                       onChange={set('code')} disabled={!!editing.id}/>
                            <TextField size="small" label="Təsvir" value={editing.description} onChange={set('description')} sx={{gridColumn: {sm: '1 / -1'}}}/>
                            <TextField select size="small" label="Defolt şöbə" value={editing.default_department} onChange={set('default_department')}>
                                <MenuItem value="">— Yoxdur —</MenuItem>
                                {(meta?.departments || []).map((d) => <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>)}
                            </TextField>
                            <TextField select size="small" label="Defolt prioritet" value={editing.default_priority} onChange={set('default_priority')}>
                                {Object.entries(PRIORITY_META).map(([v, m]) => <MenuItem key={v} value={v}>{m.label}</MenuItem>)}
                            </TextField>
                            <TextField size="small" type="color" label="Rəng" value={editing.color} onChange={set('color')} InputLabelProps={{shrink: true}}/>
                            <TextField size="small" type="number" label="Sıra" value={editing.order} onChange={set('order')}/>
                            <FormControlLabel control={<Switch checked={editing.is_active} onChange={(e) => setEditing((c) => ({...c, is_active: e.target.checked}))}/>} label="Aktivdir"/>
                        </Box>
                    </DialogContent>
                )}
                <DialogActions sx={{px: 3, py: 2}}>
                    <Button onClick={() => setEditing(null)} disabled={saving}>İmtina</Button>
                    <Button variant="contained" onClick={save} disabled={saving}>{saving ? <CircularProgress size={18} sx={{color: '#fff'}}/> : 'Yadda saxla'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}