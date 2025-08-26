import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing Supabase database schema...')
    
    // Test each table to see what columns exist
    const results: any = {
      users: null,
      teams: null,
      team_members: null,
      team_invites: null,
      videos: null,
      upload_locks: null
    }
    
    // Test users table
    try {
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(1)
      
      if (usersError && usersError.code !== 'PGRST116') {
        results.users = { error: usersError.message, code: usersError.code }
      } else {
        results.users = {
          success: true,
          columns: usersData?.[0] ? Object.keys(usersData[0]) : 'No data, but table exists'
        }
      }
    } catch (e: any) {
      results.users = { error: e.message }
    }
    
    // Test teams table
    try {
      const { data: teamsData, error: teamsError } = await supabaseAdmin
        .from('teams')
        .select('*')
        .limit(1)
      
      if (teamsError && teamsError.code !== 'PGRST116') {
        results.teams = { error: teamsError.message, code: teamsError.code }
      } else {
        results.teams = {
          success: true,
          columns: teamsData?.[0] ? Object.keys(teamsData[0]) : 'No data, but table exists'
        }
      }
    } catch (e: any) {
      results.teams = { error: e.message }
    }
    
    // Test team_members table
    try {
      const { data: membersData, error: membersError } = await supabaseAdmin
        .from('team_members')
        .select('*')
        .limit(1)
      
      if (membersError && membersError.code !== 'PGRST116') {
        results.team_members = { error: membersError.message, code: membersError.code }
      } else {
        results.team_members = {
          success: true,
          columns: membersData?.[0] ? Object.keys(membersData[0]) : 'No data, but table exists'
        }
      }
    } catch (e: any) {
      results.team_members = { error: e.message }
    }
    
    // Test team_invites table
    try {
      const { data: invitesData, error: invitesError } = await supabaseAdmin
        .from('team_invites')
        .select('*')
        .limit(1)
      
      if (invitesError && invitesError.code !== 'PGRST116') {
        results.team_invites = { error: invitesError.message, code: invitesError.code }
      } else {
        results.team_invites = {
          success: true,
          columns: invitesData?.[0] ? Object.keys(invitesData[0]) : 'No data, but table exists'
        }
      }
    } catch (e: any) {
      results.team_invites = { error: e.message }
    }
    
    // Test videos table  
    try {
      const { data: videosData, error: videosError } = await supabaseAdmin
        .from('videos')
        .select('*')
        .limit(1)
      
      if (videosError && videosError.code !== 'PGRST116') {
        results.videos = { error: videosError.message, code: videosError.code }
      } else {
        results.videos = {
          success: true,
          columns: videosData?.[0] ? Object.keys(videosData[0]) : 'No data, but table exists'
        }
      }
    } catch (e: any) {
      results.videos = { error: e.message }
    }
    
    // Test upload_locks table
    try {
      const { data: locksData, error: locksError } = await supabaseAdmin
        .from('upload_locks')
        .select('*')
        .limit(1)
      
      if (locksError && locksError.code !== 'PGRST116') {
        results.upload_locks = { error: locksError.message, code: locksError.code }
      } else {
        results.upload_locks = {
          success: true,
          columns: locksData?.[0] ? Object.keys(locksData[0]) : 'No data, but table exists'
        }
      }
    } catch (e: any) {
      results.upload_locks = { error: e.message }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase schema check complete',
      results: results
    })
  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

