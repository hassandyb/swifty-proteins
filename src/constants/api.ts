export const API_URLS = {
  CIF_BASE: 'https://files.rcsb.org/ligands/view',
  getCifUrl: (ligandId: string) =>
    `${API_URLS.CIF_BASE}/${ligandId.toUpperCase()}.cif`,
} as const;

export const CIF_FIELDS = {
  ATOM: {
    COMP_ID: '_chem_comp_atom.comp_id',
    ATOM_ID: '_chem_comp_atom.atom_id',
    TYPE_SYMBOL: '_chem_comp_atom.type_symbol',
    X: '_chem_comp_atom.model_cartn_x',
    Y: '_chem_comp_atom.model_cartn_y',
    Z: '_chem_comp_atom.model_cartn_z',
    IDEAL_X: '_chem_comp_atom.pdbx_model_cartn_x_ideal',
    IDEAL_Y: '_chem_comp_atom.pdbx_model_cartn_y_ideal',
    IDEAL_Z: '_chem_comp_atom.pdbx_model_cartn_z_ideal',
  },
  BOND: {
    COMP_ID: '_chem_comp_bond.comp_id',
    ATOM_ID_1: '_chem_comp_bond.atom_id_1',
    ATOM_ID_2: '_chem_comp_bond.atom_id_2',
    VALUE_ORDER: '_chem_comp_bond.value_order',
  },
} as const;