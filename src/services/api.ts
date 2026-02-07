// API Service Layer for StyloCoin Admin Dashboard
// Centralized API calls with authentication handling

// Prefer configured API URL; avoid localhost default in production to prevent Netlify runtime failures
// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim() !== ''
//     ? import.meta.env.VITE_API_BASE_URL
//     : (import.meta.env.PROD ? '' : 'http://localhost:8080');

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  // "https://Minecryptos-env.eba-nsbmtw9i.ap-south-1.elasticbeanstalk.com";
  "http://containershipment-app-env.eba-p7ijagki.ap-south-1.elasticbeanstalk.com"


// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem("stylocoin_token");
};

// Create headers with auth token
const createHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    "Accept": "application/json",
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Create headers for file upload (without Content-Type to let browser set boundary)
const createFileUploadHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Generic API call function
const apiCall = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: createHeaders(),
    ...(body && { body: JSON.stringify(body) })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API Error:', {
      endpoint,
      method,
      status: response.status,
      errorData,
    });
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Rank & Reward API functions
export interface RankReward {
  rankId: number | null;
  userNodeId: string;
  rankName: string;
  matching: number;
  reward: number;
  achieved: boolean;
  // Additional fields for updates
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
  isDeleted?: boolean;
  isGenericFlag?: boolean;
}

export interface AddRankRewardRequest {
  rankId: null;
  rankName: string;
  userNodeId: string;
  matching: Number;
  reward: Number;
  achieved: boolean;
}

export const rankRewardApi = {
  // Get all ranks with pagination and filtering
  getAll: (page: number = 0, size: number = 25, filterBy: string = 'ACTIVE'): Promise<{ content: RankReward[], totalElements: number }> =>
    apiCall<any>(`/api/admin/getRankAndReward?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=null`).then(response => ({
      content: response.data || [],
      totalElements: response.count || 0
    })),
  getRankMaster: (page: number = 0, size: number = 25, filterBy: string = 'ACTIVE'): Promise<{ content: RankReward[], totalElements: number }> =>
    apiCall<any>(`/api/individual/getRankMaster?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=null`).then(response => ({
      content: response.data || [],
      totalElements: response.count || 0
    })),

  // Add new rank
  add: (data: AddRankRewardRequest): Promise<RankReward> =>
    apiCall<any>('/api/admin/addRankAndReward', 'POST', data).then(response => response.data?.[0] || response),

  // Update existing rank
  update: (id: number, data: Partial<RankReward>): Promise<RankReward> =>
    apiCall<any>(`/api/admin/updateRankAndReward/${id}`, 'PUT', data).then(response => response.data?.[0] || response),

  // Delete rank
  delete: (id: number): Promise<void> =>
    apiCall<void>(`/api/admin/deleteRankAndReward/${id}`, 'DELETE')
};

// Income Type API functions
export interface IncomeType {
  incomeTypePkId: number | null;
  incomeName: string;
  percentage: number;
  incomeTypeCode?: string | null;
  level?: number | null;
  // Additional fields for updates
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
  isDeleted?: boolean;
  isGenericFlag?: boolean;
}

export interface AddIncomeTypeRequest {
  incomeTypePkId: null;
  incomeName: string;
  percentage: number;
  incomeTypeCode: string;
  level: number;
}
export interface SubscriptionType {
  subscriptionDefinitionPkId: number | null;
  subscriptionName: string;
  subscriptionCode: string,
  subscriptionAmount: number;
  subscriptionStartDateTime?: string | null;
  subscriptionEndDateTime?: number | null;
  // Additional fields for updates
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
  isDeleted?: boolean;
  isGenericFlag?: boolean;
}
export interface WithdrawalType {
  withdrawalRequestPkId: number | null;
  userName: string;
  userNodeId: string;
  finalAmount: number,
  amount: number;
  createdDatetime?: string | null;
  subscriptionEndDateTime?: number | null;
  // Additional fields for updates
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  lastModifiedDateTime?: string;
  isDeleted?: boolean;
  isGenericFlag?: boolean;
}
export interface WalletAddressType {
  wallet: string;
  address: string,
  createdAt: string,
  status: string,
  // Additional fields for updates
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
  isDeleted?: boolean;
  isGenericFlag?: boolean;
}
export interface IncomeStreams {
  individualIncomeSummaryPkId: number | null;
  serviceGenerationAmount: number;
  matchingIncomeAmount: number,
  clubIncomeAmount: number;
  rewardIncomeAmount?: number;
  fastTrackBonusAmount?: number;
  miningProfitSharingAmount?: number;
  miningGenerationIncomeAmount?: number;
  nodeBusinessSharingAmount?: number;
  userNodeId: number,
  userName: string
  // Additional fields for updates
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
  isDeleted?: boolean;
  isGenericFlag?: boolean;
}
export interface businessApiType {
  directTeam: number | null;
  totalTeam: number;
  teamBusiness: number,
  totalActiveTeamLeft: number;
  totalActiveTeamRight?: number;
  strongLegTeam?: number;
  weakerLegTeam?: number;
  carryForwardLeft?: number;
  carryForwardRight?: number;
  currentMiningBusinessLeft: number,
  currentMiningBusinessRight: number,
  totalMiningBusinessLeft: number,
  totalMiningBusinessRight: number,
  userNodeId: number,
  userName: string
  // Additional fields for updates
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
  isDeleted?: boolean;
  isGenericFlag?: boolean;
}
export interface AddSubscriptionTypeRequest {
  subscriptionDefinitionPkId: null;
  subscriptionName: string;
  subscriptionAmount: number;
}

// Wallet Data interfaces
export interface WalletData {
  walletPkId: number;
  mineWallet: number;
  nodeWallet: number;
  capitalWallet: number;
  totalCredit: number;
  totalDebit: number;
  userFkId: number;
  userNodeCode?: string;
  isGenericFlag?: boolean;
  isDeleted?: boolean;
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
}
export interface DataApi {
  totalUser: number,
  totalActiveUser: number,
  totalInactiveUser: number,
  totalNormalUser: number,
  totalAdminUser: number,
  totalWallet: number,
  totalMineWallet: number,
  totalMineInvestment?: string | null,
  nodewallet: number,
  capitalWallet: number,
  totalROIIncome?: string | null,
  totalWithdrawal?: string | null,
  totalDirectIncome?: string | null,
  totalDeposit?: string | null,
  totalCredit: number,
  totalDebit: number,
  totalRevenue?: string | null,
  totalNetProfit?: string | null,
}

export interface AddWalletDataRequest {
  walletPkId: null;
  mineWallet: number;
  nodeWallet: number;
  capitalWallet: number;
  totalCredit: number;
  totalDebit: number;
  userFkId: number;
}

export const incomeTypeApi = {
  // Get all income types with pagination and filtering
  getAll: (page: number = 0, size: number = 25, filterBy: string = 'ACTIVE'): Promise<{ content: IncomeType[], totalElements: number }> =>
    apiCall<any>(`/api/admin/getIncomeType?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=null`).then(response => ({
      content: response.data || [],
      totalElements: response.count || 0
    })),

  // Add new income type
  add: (data: AddIncomeTypeRequest): Promise<IncomeType> =>
    apiCall<any>('/api/admin/addIncomeType', 'POST', data).then(response => response.data?.[0] || response),

  // Update existing income type
  update: (id: number, data: Partial<IncomeType>): Promise<IncomeType> =>
    apiCall<any>(`/api/admin/updateIncomeType/${id}`, 'PUT', data).then(response => response.data?.[0] || response),

  // Delete income type
  delete: (id: number): Promise<void> =>
    apiCall<void>(`/api/admin/deleteIncomeType/${id}`, 'DELETE')
};
export const walletAddressApi = {
  getAll: (page: number = 0, size: number = 25, filterBy: string = 'ACTIVE', userNodeId?: string | null): Promise<{ content: WalletData[], totalElements: number }> =>
    apiCall<any>(`/api/individual/getUserWalletAddress?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=${userNodeId || 'null'}`).then(response => ({
      content: response.data || [],
      totalElements: response.count || 0
    })),
}
export const businessApi = {
  getAll: (page: number = 0, size: number = 25, filterBy: string = 'ACTIVE', userNodeId?: string | null): Promise<{ content: businessApiType[], totalElements: number }> =>
    apiCall<any>(`/api/individual/getBusinessDetails?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=${userNodeId || 'null'}`).then(response => ({
      content: response || [],
      totalElements: response.count || 0
    })),
}
export const subscriptionIncomeTypeApi = {
  // Get all subscription types with pagination and filtering
  getAll: (page: number = 0, size: number = 25, filterBy: string = 'ACTIVE'): Promise<{ content: SubscriptionType[], totalElements: number }> =>
    apiCall<any>(`/api/admin/getSubscriptionDefinition?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=null`).then(response => ({
      content: response.data || [],
      totalElements: response.count || 0
    })),

  // Add new subscription type
  add: (data: AddSubscriptionTypeRequest): Promise<SubscriptionType> =>
    apiCall<any>('/api/admin/addSubscriptionDefinition', 'POST', data).then(response => response.data?.[0] || response),

  // Update existing subscription type
  update: (id: number, data: Partial<SubscriptionType>): Promise<SubscriptionType> =>
    apiCall<any>(`/api/admin/updateSubscriptionDefinition/${id}`, 'PUT', data).then(response => response.data?.[0] || response),

  // Delete subscription type
  delete: (id: number): Promise<void> =>
    apiCall<void>(`/api/admin/deleteSubscriptionDefinition/${id}`, 'DELETE')
};
export const manageWithdrawalApi = {
  getAll: (page: number = 0, size: number = 25, filterBy: string = 'ACTIVE'): Promise<{ content: WithdrawalType[], totalElements: number }> =>
    apiCall<any>(`/api/individual/getWithdrawalRequest?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=null`).then(response => ({
      content: response.data || [],
      totalElements: response.count || 0
    })),
  // addOtp: (email: string , userNodeId?: string | null): Promise<UsersResponse> =>
  //   apiCall<any>(`/api/individual/sendEmailOtp?email=${email}&userNodeId=${userNodeId}`, 'POST').then(response => response.data?.[0] || response)
  add: (withdrawalRequestPkId: number | null): Promise<SubscriptionType> =>
    apiCall<any>(`/api/withdraw/approve/${withdrawalRequestPkId}`, 'POST').then(response => response.data?.[0] || response),
  //reject withdrawal
  reject: (withdrawalRequestPkId: number | null): Promise<SubscriptionType> =>
    apiCall<any>(`/api/withdraw/reject/${withdrawalRequestPkId}`, 'PUT').then(response => response.data?.[0] || response),
}

// Wallet Data API functions
export const walletDataApi = {
  // Get all wallet data with pagination and filtering
  getAll: (page: number = 0, size: number = 25, filterBy: string = 'ACTIVE', userNodeId?: string | null): Promise<{ content: WalletData[], totalElements: number }> =>
    apiCall<any>(`/api/individual/getWalletData?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=${userNodeId || 'null'}`).then(response => ({
      content: response.data || [],
      totalElements: response.count || 0
    })),

  // Add new wallet data
  add: (data: AddWalletDataRequest): Promise<WalletData> =>
    apiCall<any>('/api/individual/addWalletData', 'POST', data).then(response => response.data?.[0] || response),

  // Update existing wallet data
  update: (id: number, data: Partial<WalletData>): Promise<WalletData> =>
    apiCall<any>(`/api/individual/updateWalletData/${id}`, 'PUT', data).then(response => response.data?.[0] || response),

  // Delete wallet data
  delete: (id: number): Promise<void> =>
    apiCall<void>(`/api/individual/deleteWalletData/${id}`, 'DELETE'),

  // Add new wallet data
  addOtp: (email: string, userNodeId?: string | null): Promise<UsersResponse> =>
    apiCall<any>(`/api/individual/sendEmailOtp?email=${email}&userNodeId=${userNodeId}`, 'POST').then(response => response.data?.[0] || response),

};
export const incomeStreamsApi = {
  getAll: (page: number = 0, size: number = 25, filterBy: string = 'ACTIVE', userNodeId?: string | null): Promise<{ content: IncomeStreams[], totalElements: number }> =>
    apiCall<any>(`/api/individual/getIndividualIncomeSummary?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=${userNodeId || 'null'}`).then(response => ({
      content: response.data || [],
      totalElements: response.count || 0
    })),
}
export const transferWalletDropdownApi = {
  // Get wallet transfer dropdown options
  getDropdownOptions: (userNodeId?: string | null): Promise<{ content: SubscriptionType[], totalElements: number }> =>
    apiCall<any>(`/api/individual/getHierarchy?loggedInNodeId=${userNodeId || 'null'}`).then(response => ({
      content: response.data || [],
      totalElements: response.count || 0
    }))
};

// Wallet Transaction interfaces
export interface WalletTransaction {
  walletTxnPkId?: number;
  transactionId?: string | null;
  transactionType?: string; // 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'
  amount?: number;
  walletType?: string; // 'MINE' | 'NODE' | 'CAPITAL'
  status?: string; // 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED'
  userFkId?: number;
  userName?: string;
  fromUserId?: string;
  toUserId?: string;
  fromWallet?: string;
  toWallet?: string;
  description?: string;
  remarks?: string;
  confirmedAt?: string | null;
  // common optional fields
  isDeleted?: boolean;
  isGenericFlag?: boolean;
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
}

// Wallet Transfer Request interface
export interface WalletTransferRequest {
  walletTxnPkId?: null;
  transactionId?: null;
  fromUserId: string;
  toUserId: string;
  // fromWallet: "MINE_WALLET" | "CAPITAL_WALLET" | "NODE_WALLET";
  toWallet: "MINE_WALLET" | "CAPITAL_WALLET" | "NODE_WALLET";
  amount: number;
  status?: "IN_PROGRESS" | "SUCCESS" | "FAILED";
  remarks?: string;
  confirmedAt?: null;
}
export interface WalletAddressRequest {
  walletAdresPkId?: null;
  selectedWallet?: string;
  transactionId?: null;
  address: string;
  // createdAt: string;
  status: string;
}

// Wallet Transaction API functions
export const walletTransactionApi = {
  // Get all wallet transactions with pagination and filtering
  getAll: (
    page: number = 0,
    size: number = 25,
    filterBy: string = 'ACTIVE',
    inputPkId: string | null,
    inputFkId: string | null,
    userNodeId?: string | null
  ): Promise<{ content: WalletTransaction[]; totalElements: number; count?: number }> =>
    apiCall<any>(
      `/api/individual/getWalletTransaction?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=${inputPkId}&inputFkId=${inputFkId}`


      // `/api/admin/getWalletTransaction?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=null`
    ).then((response) => ({
      content: response.data || [],
      totalElements: response.count || 0,
      count: response.count,
    })),

  // Confirm wallet transaction (admin only)
  confirmWalletTransaction: (walletTxnPkId: number): Promise<WalletTransaction> =>
    apiCall<any>(`/api/admin/confirmWalletTransaction/${walletTxnPkId}`, 'POST').then(
      (response) => response.data?.[0] || response
    ),
};

// Wallet Transfer API functions
export const walletTransferApi = {
  // Create wallet transfer
  create: (data: WalletTransferRequest): Promise<any> =>
    apiCall<any>('/api/individual/addWalletTransaction', 'POST', data).then(
      (response) => response.data?.[0] || response
    ),
};
export const addwalletAddressApi = {
  // Create wallet transfer
  create: (data: WalletAddressRequest): Promise<any> =>
    apiCall<any>('/api/individual/addUserWalletAddress', 'POST', data).then(
      (response) => response.data?.[0] || response
    ),
};


// Individual Income Summary interfaces
export interface IndividualIncomeSummary {
  individualIncomeSummaryPkId: number;
  serviceGenerationAmount: number;
  matchingIncomeAmount: number;
  clubIncomeAmount: number;
  rewardIncomeAmount: number;
  fastTrackBonusAmount: number;
  miningProfitSharingAmount: number;
  miningGenerationIncomeAmount: number;
  nodeBusinessSharingAmount: number;
  userFkId: number;
  isGenericFlag?: boolean;
  isDeleted?: boolean;
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
}

export interface AddIndividualIncomeSummaryRequest {
  individualIncomeSummaryPkId: null;
  serviceGenerationAmount: number;
  matchingIncomeAmount: number;
  clubIncomeAmount: number;
  rewardIncomeAmount: number;
  fastTrackBonusAmount: number;
  miningProfitSharingAmount: number;
  miningGenerationIncomeAmount: number;
  nodeBusinessSharingAmount: number;
  userFkId: number;
}

// Individual Income Summary API functions
export const individualIncomeSummaryApi = {
  // Get all individual income summary with pagination and filtering
  getAll: (page: number = 0, size: number = 25, filterBy: string = 'ACTIVE', userNodeId?: string | null): Promise<{ data: IndividualIncomeSummary[], count: number }> =>
    apiCall<any>(`/api/individual/getIndividualIncomeSummary?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=${userNodeId || 'null'}`).then(response => ({
      data: response.data || [],
      count: response.count || 0
    })),

  // Add new individual income summary
  add: (data: AddIndividualIncomeSummaryRequest): Promise<IndividualIncomeSummary> =>
    apiCall<any>('/api/individual/addIndividualIncomeSummary', 'POST', data).then(response => response.data?.[0] || response),

  // Update existing individual income summary
  update: (id: number, data: Partial<IndividualIncomeSummary>): Promise<IndividualIncomeSummary> =>
    apiCall<any>(`/api/individual/updateIndividualIncomeSummary/${id}`, 'PUT', data).then(response => response.data?.[0] || response),

  // Delete individual income summary
  delete: (id: number): Promise<void> =>
    apiCall<void>(`/api/individual/deleteIndividualIncomeSummary/${id}`, 'DELETE')
};

// User interfaces
export interface User {
  userPkId: number;
  versionId: string;
  nodeId: string;
  name: string;
  email: string;
  password: string;
  country: string;
  mobile: string;
  referralCode: string;
  position: string;
  isUserIsAdmin: boolean;
  roles: Array<{ roleId: number; name: string }>;
  enabled: boolean;
  authorities: Array<{ authority: string }>;
  username: string;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  isDeleted: boolean;
  isGenericFlag: boolean;
  userStatus: string;
  isConfirmed?: boolean; // User confirmation status for mining access
  imageUrl?: string | null; // User profile image URL (deprecated, use profileImageUrl)
  profileImageUrl?: string | null; // User profile image URL from API
  imageId?: string | null; // User profile image ID
  // Additional fields
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
}

export interface UsersResponse {
  id: null;
  uuid: null;
  name: null;
  status: string;
  check: boolean;
  statusCode: string;
  timeStamp: number;
  count: number;
  videoUrl: null;
  attechUrl: null;
  data: User[];
  map: null;
  stringMap: null;
  message: null;
  response: null;
  versionId: null;
  lastModifiedDateTime: null;
  relationShipMap: null;
  personid: null;
  positionId: null;
  relationshipType: null;
  bigDecimal: null;
  doubleValue: null;
  commonMap: null;
  warningResponse: null;
  isLoginPersonIsPHManager: boolean;
  isLoginPersonIsAdmin: boolean;
  companyList: null;
  regionList: null;
  countSize: number;
}

export interface UpdateUserStatusRequest {
  userId: number;
  enabled: boolean;
}

export interface ApproveTransactionRequest {
  userId: number;
  transactionId: number;
  approved: boolean;
}

// Users API functions
export const usersApi = {
  // Get all users with pagination and filtering
  getAll: (page: number = 0, size: number = 25, filterBy: string = 'ACTIVE', userNodeId?: string | null): Promise<UsersResponse> =>
    apiCall<UsersResponse>(`/api/users/getUser?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=null`),

  // Get user by userPkId
  getById: (userPkId: number, filterBy: string = 'ACTIVE'): Promise<User | null> =>
    apiCall<UsersResponse>(`/api/users/getUser?page=0&size=25&filterBy=${filterBy}&inputPkId=${userPkId}&inputFkId=null`)
      .then(response => response.data && response.data.length > 0 ? response.data[0] : null),

  // Delete user
  delete: (userId: number): Promise<void> =>
    apiCall<void>(`/api/admin/deleteUser/${userId}`, 'DELETE'),

  // Update user status (active/inactive)
  updateStatus: (userId: number, enabled: boolean): Promise<User> =>
    apiCall<User>(`/api/admin/updateUserStatus/${userId}`, 'PUT', { enabled }),

  // Approve transaction
  approveTransaction: (data: ApproveTransactionRequest): Promise<void> =>
    apiCall<void>('/api/admin/approveTransaction', 'POST', data),

  // Confirm user (admin only)
  confirmUser: (nodeId: string): Promise<void> =>
    apiCall<void>(`/api/admin/confirmUser/${nodeId}`, 'PUT')
};

// Mining Package interfaces
export interface MiningPackageItem {
  miningPackagePkId?: number;
  userNodeCode?: string;
  packageAmount?: number;
  remarks?: string;
  nodeAmount: number;
  mode?: string; // e.g. 'NODE'
  transactionPassword?: string;
  packageStatus?: string; // e.g. 'IN_PROGRESS'
  localDateTime?: string | null;
  timeStamp?: number | string; // Date timestamp
  // common optional fields
  isDeleted?: boolean;
  isGenericFlag?: boolean;
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
}

export interface AddMiningPackageRequest {
  miningPackagePkId: null;
  // Depending on backend, one of these identifiers might be required
  userNodeCode: string;
  packageAmount: number;
  mode: string; // 'NODE' or similar
  transactionPassword?: string;
  remarks?: string;
  packageStatus: 'IN_PROGRESS' | 'APPROVED';
  localDateTime?: string | null; // ISO string format date/time
}

// Mining Package API functions
export const miningPackageApi = {
  getAll: (
    page: number = 0,
    size: number = 25,
    mode: string,
    filterBy: string = 'ACTIVE',
    userNodeId?: string | null
  ): Promise<{ content: MiningPackageItem[]; totalElements: number; count?: number }> =>
    apiCall<any>(
      `/api/individual/getIndividualMiningPackage?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=${mode}&inputFkId=${userNodeId || 'null'}`
    ).then((response) => ({
      content: response.data || [],
      totalElements: response.count || 0,
      count: response.count,
    })),

  add: (data: AddMiningPackageRequest): Promise<MiningPackageItem> =>
    apiCall<any>(`/api/individual/addMiningPackage`, 'POST', data).then(
      (response) => response.data?.[0] || response
    ),

  update: (
    id: number,
    data: Partial<MiningPackageItem>
  ): Promise<MiningPackageItem> =>
    apiCall<any>(`/api/individual/updateMiningPackage/${id}`, 'PUT', data).then(
      (response) => response.data?.[0] || response
    ),

  delete: (id: number): Promise<void> =>
    apiCall<void>(`/api/individual/deleteMiningPackage/${id}`, 'DELETE'),
};
// export const adminDashboardCard ={
//   getAll:(
//     page: number = 0,
//     size: number = 25,
//     filterBy: string = 'ACTIVE',
//     inputPkId: string | null,
//     inputFkId: string | null
//   ): Promise<{ content: MiningPackageItem[]; totalElements: number; count?: number }> =>
//     apiCall<any>(
//       `/api/admin/getAdminDashboardCount?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=${inputPkId}&inputFkId=${inputFkId}`
//     ).then((response) => ({
//       content: response.data || [],
//       totalElements: response.count || 0,
//       count: response.count,
//     })),
//     //api/admin/getAdminDashboardCount?page=0&size=25&filterBy=ACTIVE&inputPkId=null&inputFkId=null
// }
// I.E. Data API functions
export const ieDataApi = {
  // Get all I.E. data with pagination and filtering
  getAll: (
    page: number = 0,
    size: number = 25,
    filterBy: string = 'ACTIVE'
  ): Promise<{ content: IeData[]; totalElements: number }> =>
    apiCall<any>(
      `/api/admin/getAdminDashboardCount?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=null`
    ).then((response) => ({
      content: response || [],
      totalElements: response.count || 0,
    })),
};

// Deposit Fund interfaces
export interface DepositFundItem {
  depositPkId?: number;
  // depositFundPkId?: number;
  currency?: string;
  amount?: number;
  transactionPassword?: string;
  status?: string;
  userFkId?: number;
  userName?: string;
  userNodeCode?: string;
  confirmedAt?: string;
  // common optional fields
  isDeleted?: boolean;
  isGenericFlag?: boolean;
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
  response?: DepositFundItem
}

export interface AddDepositFundRequest {
  // depositFundPkId: null;
  depositPkId: null;
  currency: string;
  amount: number;
  transactionPassword: string;
  userFkId?: number;
  userNodeCode?: string;
}

// Deposit Fund API functions
export const depositFundApi = {
  getAll: (
    page: number = 0,
    size: number = 25,
    filterBy: string = 'ACTIVE',
    userNodeId?: string | null
  ): Promise<{ content: DepositFundItem[]; totalElements: number; count?: number }> =>
    apiCall<any>(
      `/api/individual/getIndividualDepositFund?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=${userNodeId}`
    ).then((response) => ({
      content: response.data || [],
      totalElements: response.count || 0,
      count: response.count,
    })),

  add: (data: AddDepositFundRequest): Promise<DepositFundItem> =>
    apiCall<any>(`/api/individual/addDepositFund`, 'POST', data).then(
      (response) => response.data?.[0] || response
    ),

  update: (id: number, data: Partial<DepositFundItem>): Promise<DepositFundItem> =>
    apiCall<any>(`/api/individual/updateDepositFund/${id}`, 'PUT', data).then(
      (response) => response.data?.[0] || response
    ),

  delete: (id: number): Promise<void> =>
    apiCall<void>(`/api/individual/deleteDepositFund/${id}`, 'DELETE'),

  // Confirm deposit (admin only)
  confirmDeposit: (depositId: number): Promise<DepositFundItem> =>
    apiCall<any>(`/api/admin/confirmDeposit/${depositId}`, 'POST').then(
      (response) => response.data?.[0] || response
    ),
};

// Update Profile interfaces
export interface UpdateProfileRequest {
  userName: string | null;
  email: string | null;
  country: string | null;
  mobile: string | null;
  transactionPassword: string | null;
  userNodeId: string | null;
}

export interface UpdateProfileResponse {
  success?: boolean;
  message?: string;
  data?: any;
  // Response fields that may be returned directly
  country?: string;
  userName?: string;
  email?: string;
  mobile?: string;
  transactionPassword?: string | null;
  userNodeId?: string;
}

// Individual Profile API functions
export const individualProfileApi = {
  // Update user profile
  updateProfile: (data: UpdateProfileRequest): Promise<UpdateProfileResponse> =>
    apiCall<any>('/api/individual/updateProfile', 'PUT', data).then(
      (response) => response
    ),
};

// Image Upload interfaces
export interface ImageUploadResponse {
  success?: boolean;
  message?: string;
  data?: {
    imageUrl?: string;
    profileImageUrl?: string; // Primary field from API response
    imageId?: string;
    fileName?: string;
    [key: string]: any;
  };
  profileImageUrl?: string; // Can also be at root level
  imageUrl?: string; // For backward compatibility
  imageId?: string;
  [key: string]: any;
}

// Image Upload API functions
export const imageUploadApi = {
  // Upload user image
  uploadUserImage: (userNodeId: string, file: File): Promise<ImageUploadResponse> => {
    const url = `${API_BASE_URL}/api/image/upload?userNodeId=${userNodeId}`;
    const formData = new FormData();
    formData.append('file', file);

    return fetch(url, {
      method: 'POST',
      headers: createFileUploadHeaders(),
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        // Handle specific status codes
        if (response.status === 413) {
          errorMessage = '413 Request Entity Too Large - Image file is too large. Please compress the image before uploading.';
        } else if (response.status === 400) {
          errorMessage = '400 Bad Request - Invalid image file format.';
        }

        const errorData = await response.json().catch(() => ({}));
        console.error('Image Upload Error:', {
          endpoint: '/api/image/upload',
          method: 'POST',
          status: response.status,
          errorData,
          fileSize: file.size,
        });

        throw new Error(errorData.message || errorMessage);
      }
      return response.json();
    });
  },
};

// Support Ticket interfaces
export interface SupportTicket {
  supportTicketPkId: number | null;
  category: string; // DEPOSIT, CLOSING, WITHDRAWAL, OTHERS
  priority: string; // NORMAL, URGENT, HIGH, LOW
  userNodeId: string;
  message: string;
  status: string; // OPEN, IN_PROGRESS, CLOSED
  updatedAtDateTime: string | null;
  transactionPassword?: string | null;
  otp?: string | null;
  userName?: string;
  isGenericFlag?: boolean;
  isDeleted?: boolean;
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
}

export interface AddSupportTicketRequest {
  supportTicketPkId: null;
  category: string; // DEPOSIT, CLOSING, WITHDRAWAL, OTHERS
  priority: string; // NORMAL, URGENT, HIGH, LOW
  userNodeId: string;
  message: string;
  status: string; // OPEN, IN_PROGRESS, CLOSED
  updatedAtDateTime: null;
  transactionPassword?: string | null;
  otp?: string | null;
}

// Support Ticket API functions
export const supportTicketApi = {
  // Get all support tickets with pagination and filtering
  getAll: (
    page: number = 0,
    size: number = 25,
    filterBy: string = 'ACTIVE',
    userNodeId?: string | null
  ): Promise<{ content: SupportTicket[]; totalElements: number; count?: number }> =>
    apiCall<any>(
      `/api/individual/getSupportTicket?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=${userNodeId || 'null'}`
    ).then((response) => ({
      content: response.data || [],
      totalElements: response.count || 0,
      count: response.count,
    })),

  // Add new support ticket
  add: (data: AddSupportTicketRequest): Promise<SupportTicket> =>
    apiCall<any>(`/api/individual/addSupportTicket`, 'POST', data).then(
      (response) => response.data?.[0] || response
    ),

  // Update existing support ticket
  update: (id: number, data: Partial<SupportTicket>): Promise<SupportTicket> =>
    apiCall<any>(`/api/individual/updateSupportTicket/${id}`, 'PUT', data).then(
      (response) => response.data?.[0] || response
    ),

  // Delete support ticket
  delete: (id: number): Promise<void> =>
    apiCall<void>(`/api/individual/deleteSupportTicket/${id}`, 'DELETE'),
};

// Withdrawal Request interfaces
export interface WithdrawalRequest {
  withdrawalRequestPkId: number | null;
  username: string;
  userNodeId: string;
  walletType: string; // e.g., "USDT.BEP20"
  walletAddress: string;
  amount: number;
  status: string; // PENDING, APPROVED, REJECTED
  updatedAtDateTime: string | null;
  transactionPassword: string | null;
  otp: string | null;
  // Common optional fields
  isDeleted?: boolean;
  isGenericFlag?: boolean;
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
}

export interface AddWithdrawalRequestRequest {
  withdrawalRequestPkId: null;
  username: string;
  userNodeId: string;
  walletType: string; // e.g., "USDT.BEP20"
  walletAddress: string;
  amount: number;
  status: "PENDING";
  updatedAtDateTime: null;
  transactionPassword: string | null;
  otp: string | null;
}

// Withdrawal Request API functions
export const withdrawalRequestApi = {
  // Get all withdrawal requests with pagination and filtering
  getAll: (
    page: number = 0,
    size: number = 25,
    filterBy: string = 'ACTIVE',
    userNodeId?: string | null
  ): Promise<{ content: WithdrawalRequest[]; totalElements: number; count?: number }> =>
    apiCall<any>(
      `/api/individual/getWithdrawalRequest?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=${userNodeId || 'null'}`
    ).then((response) => ({
      content: response.data || [],
      totalElements: response.count || 0,
      count: response.count,
    })),

  // Add new withdrawal request
  add: (data: AddWithdrawalRequestRequest): Promise<WithdrawalRequest> =>
    apiCall<any>(`/api/individual/addWithDrawalRequest`, 'POST', data).then(
      (response) => response.data?.[0] || response
    ),

  // Update existing withdrawal request
  update: (id: number, data: Partial<WithdrawalRequest>): Promise<WithdrawalRequest> =>
    apiCall<any>(`/api/individual/updateWithDrawalRequest/${id}`, 'PUT', data).then(
      (response) => response.data?.[0] || response
    ),

  // Delete withdrawal request
  delete: (id: number): Promise<void> =>
    apiCall<void>(`/api/individual/deleteWithDrawalRequest/${id}`, 'DELETE'),
};

// Export default API object
export default {
  rankReward: rankRewardApi,
  incomeType: incomeTypeApi,
  walletData: walletDataApi,
  walletTransaction: walletTransactionApi,
  individualIncomeSummary: individualIncomeSummaryApi,
  users: usersApi,
  miningPackage: miningPackageApi,
  depositFund: depositFundApi,
  individualProfile: individualProfileApi,
  imageUpload: imageUploadApi,
  supportTicket: supportTicketApi,
  withdrawalRequest: withdrawalRequestApi
};
// I.E. Data interfaces
export interface IeData {
  ieDataPkId: number | null;
  ieName: string;
  description: string;
  amount: number;
  status: string; // e.g. 'ACTIVE' | 'INACTIVE'
  createdDatetime?: string;
  lastModifiedDateTime?: string;
  isDeleted?: boolean;
  isGenericFlag?: boolean;
  notesG11nBigTxt?: string | null;
}

export interface AddIeDataRequest {
  ieDataPkId: null;
  ieName: string;
  description: string;
  amount: number;
  status: string;
}

export interface DepositRequest {
  userNodeId: string;
  amount: number;
}


export interface PaymentResponse {
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  payment_id: string;
}
// Wallet Data API functions
export const depositApi = {
  add: (data: DepositRequest): Promise<PaymentResponse> =>
    apiCall<any>('/api/deposit/create', 'POST', data)
      .then(response => response),
};

interface Container {
  containerType: string;
  ownershipType: string;
  status: string;
  userFkId: string;
  shares: number;
  roiPercentage: number | null;
  currency: string;
  investedAmount: number | null
}
export interface ContainerResponse {
  containerType: string;
  ownershipType: string;
  status: string;
  userFkId: string;
  shares: number;
  roiPercentage: number | null;
  currency: string;
  investedAmount: number | null,
  investmentPkId: number
}

// buy
export const buyContainer = {
  getAll: (
    page: number = 0,
    size: number = 25,
    filterBy: string = 'ACTIVE',
    userNodeId?: string | null
  ): Promise<{ content: ContainerResponse[]; totalElements: number; count?: number }> =>
    apiCall<any>(
      `/api/container/getInvestment?page=${page}&size=${size}&filterBy=${filterBy}&inputPkId=null&inputFkId=${userNodeId}`
    ).then((response) => ({
      content: response.data || [],
      totalElements: response.count || 0,
      count: response.count,
    })),

  add: (data: Container): Promise<Container> =>
    apiCall<any>(`/api/container/addInvestment`, 'POST', data).then(
      (response) => response.data?.[0] || response
    ),

  update: (id: number, data: Partial<DepositFundItem>): Promise<DepositFundItem> =>
    apiCall<any>(`/api/individual/updateDepositFund/${id}`, 'PUT', data).then(
      (response) => response.data?.[0] || response
    ),

  delete: (id: number): Promise<void> =>
    apiCall<void>(`/api/individual/deleteDepositFund/${id}`, 'DELETE'),

  // Confirm deposit (admin only)
  confirmDeposit: (depositId: number): Promise<DepositFundItem> =>
    apiCall<any>(`/api/admin/confirmDeposit/${depositId}`, 'POST').then(
      (response) => response.data?.[0] || response
    ),

  depositAmountImg: (
  formData: FormData,
  investmentPkId: number,
  userNodeId?: string | null,
  investedAmount?: number,
  currency?: string
): Promise<void> =>
  apiCall<void>(
    `/api/image/depositAmount?userNodeId=${userNodeId}&investmentId=${investmentPkId}&transactionId=null&amount=${investedAmount}&currency=${currency}&paidAt=null`,
    'POST',
    formData // ✅ BODY GOES HERE
  ),



 
};



export const depositReceiptUploadApi = {
  // Upload user image
  uploadUserImage: (userNodeId: string, file: File,investmentPkId:number,investedAmount?: number, currency?: string): Promise<ImageUploadResponse> => {
    const url = `${API_BASE_URL}/api/image/depositAmount?userNodeId=${userNodeId}&investmentId=${investmentPkId}&transactionId=null&amount=${investedAmount}&currency=${currency}&paidAt=null`;
    const formData = new FormData();
    formData.append('file', file);

    return fetch(url, {
      method: 'POST',
      headers: createFileUploadHeaders(),
      body: formData
    }).then(async (response) => {
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        // Handle specific status codes
        if (response.status === 413) {
          errorMessage = '413 Request Entity Too Large - Image file is too large. Please compress the image before uploading.';
        } else if (response.status === 400) {
          errorMessage = '400 Bad Request - Invalid image file format.';
        }

        const errorData = await response.json().catch(() => ({}));
        console.error('Image Upload Error:', {
          endpoint: '/api/image/upload',
          method: 'POST',
          status: response.status,
          errorData,
          fileSize: file.size,
        });

        throw new Error(errorData.message || errorMessage);
      }
      return response.json();
    });
  },
};