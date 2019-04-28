"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isProduction() {
    const serverEnv = process.env.NODE_ENV;
    if (serverEnv) {
        return serverEnv !== 'local' && serverEnv !== 'unittest';
    }
    return process.env.NODE_ENV === 'production';
}
exports.isProduction = isProduction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLFNBQWdCLFlBQVk7SUFDeEIsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7SUFDdkMsSUFBSSxTQUFTLEVBQUU7UUFDWCxPQUFPLFNBQVMsS0FBSyxPQUFPLElBQUksU0FBUyxLQUFLLFVBQVUsQ0FBQztLQUM1RDtJQUNELE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEtBQUssWUFBWSxDQUFDO0FBQ2pELENBQUM7QUFORCxvQ0FNQyJ9